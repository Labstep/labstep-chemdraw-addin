// ESLint configuration
/* global ChemDrawAPI, $ */


$(function() {
  if(window.ChemDrawAPI){
    function resizeWindowToContent() {
      // We use a fixed width and fit to the height of our content
      ChemDrawAPI.window.resizeTo(375,800);
    }

    function setImage(base64Image) {
        $('#image-data').attr('src', 'data:image/png;base64,' + base64Image);
        $('#image-data').on('load', function() {
            resizeWindowToContent();
        });
    }
    function getSVG() {

      return $('#image-preview').html()
    }
    function getImage() {
      return ChemDrawAPI.activeDocument.getPNGBase64Encoded({
          transparent: true,
          scalePercent: 100,
          borderSizeInPixels: 0
      });
    }
  }
  function formatSVG(svg){
    if(!svg.match(/\<\?xml/)){
      return '<?xml version="1.0" standalone="no" ?>'.concat(svg)
    } else {
      return svg
    }
  }

  function getMol() {
    return ChemDrawAPI.activeDocument.getMolV3000()
  }

  function svgToFile(svg,name){
    if(!name){
      name = 'ChemdrawFile.svg'
    }
    var file = new File([svg],`${name}.svg`,{type:'image/svg+xml'})
    return file
  }

  function updatePreview(){
    if (!ChemDrawAPI.activeDocument.selection.isEmpty()) {
      svg = ChemDrawAPI.activeDocument.selection.getSVG();
      // Do something with the cdxmlText and the svg image here
      $('#image-preview').html(svg)
    }
  }

  function newCommentMolecule(name, mol, svg, thread_id){
    var http = new XMLHttpRequest();
    var url = 'https://api.labstep.com/api/generic/comment';
    http.open('POST', url, true);
    var data = {
      body: null,
      comment_molecule: {
        name: name,
        data: mol,
        svg: svg,
      },
      thread_id: thread_id
    }
  
    //Send the proper header information along with the request
    http.setRequestHeader('apikey', apikey);
  
    http.onreadystatechange = function() {//Call a function when the state changes.
      if(http.readyState == 4){
        if(http.status==200){
          var response = JSON.parse(http.responseText)
          onSuccess(response)
        } else {
          onFailure()
        }
      }
    }
    http.send(JSON.stringify(data));
  }

  function createResource(name,onSuccess,onFailure){
    var http = new XMLHttpRequest();
    var url = 'https://api.labstep.com/api/generic/resource';
    http.open('POST', url, true);
    var data = {
      name: name
    }
  
    //Send the proper header information along with the request
    http.setRequestHeader('apikey', apikey);
  
    http.onreadystatechange = function() {//Call a function when the state changes.
      if(http.readyState == 4){
        if(http.status==200){
          var response = JSON.parse(http.responseText)
          onSuccess(response)
        } else {
          onFailure()
        }
      }
    }
    http.send(JSON.stringify(data));
  }

  function uploadResourceImage(file,resource,onSuccess,onFailure){
    var http = new XMLHttpRequest();
    var url = 'https://api.labstep.com/api/generic/file/upload';
    http.open('POST', url, true);

    var formData = new FormData();
    formData.append("file", file);
    formData.append("resource_image_id",resource.id)
    formData.append("group_id",resource.owner.id)
  
    //Send the proper header information along with the request
    http.setRequestHeader('apikey', apikey);
  
    http.onreadystatechange = function() {//Call a function when the state changes.
      if(http.readyState == 4){
        if(http.status==200){
          onSuccess()
        } else {
          onFailure(http.responseText)
        }
      }
    }
    http.send(formData);
  }
 
  function uploadFile(file,onSuccess,onFailure){
    var http = new XMLHttpRequest();
    var url = 'https://api.labstep.com/api/generic/file/upload';
    http.open('POST', url, true);

    var formData = new FormData();
    formData.append("file", file);
    formData.append("is_external",1)
  
    //Send the proper header information along with the request
    http.setRequestHeader('apikey', apikey);
  
    http.onreadystatechange = function() {//Call a function when the state changes.
      if(http.readyState == 4){
        if(http.status==200){
          onSuccess()
        } else {
          onFailure(http.responseText)
        }
      }
    }
    http.send(formData);
  }

  function login(username,password,onSuccess, onFailure){
    var http = new XMLHttpRequest();
    var url = 'https://api.labstep.com/public-api/user/login';
    http.open('POST', url, true);
    var data = {
      username: username,
      password: password
    }   
    http.setRequestHeader("Content-Type", "application/json");
    http.onreadystatechange = function() {//Call a function when the state changes.
      if(http.readyState == 4){
        if(http.status==200){
          var response = JSON.parse(http.responseText)
          window.apikey = response.api_key
          onSuccess(response)
        } else {
          onFailure()
        }
      }
    }
    http.send(JSON.stringify(data));
  }

  $(document).ready(function() {
      resizeWindowToContent()

      updatePreview()

      ChemDrawAPI.activeDocument.selection.onChange(function () {
        updatePreview() 
      })

      $('#upload-form').submit(function(e) {
          e.preventDefault()
          const svg = getSVG();
          const formattedSvg = formatSVG(svg);
          const mol = getMol();
          const name = $("#filename").val()
          createResource(name, function(resource){
            newCommentMolecule('Molecule',mol,formattedSvg,resource.thread.id)
            uploadResourceImage(svgToFile(formattedSvg,name),resource)
            $('#upload-success').show()
          },function(message){
            $('#upload-error').show()
            $('#error-message').html(message)
          })
      });

      $('#get-image-button').click(function() {
          const image = getImage();
          setImage(image);
      });

      $('#login-form').submit(function(e) {
        e.preventDefault()
        var username = $("#username").val()
        var password = $("#password").val()
        login(username,password,function(user){
          $('#login-form').hide();
          $('#upload-form').show();
          $('#login-status').html(`Logged in as ${user.username}`);
        }, function(){
          $('#login-error').show();
        })
      })

      $('.dismiss').click(function(){
        $('.modal').hide()
      })
      
  });
});