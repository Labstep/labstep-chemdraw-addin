// ESLint configuration
/* global ChemDrawAPI, $ */

const BUGSNAG_API_KEY = "75b38564c82dbc6abeb5f1e395b41c01";
const LOGIN_FAILED_ERR = "Username / password not recognised.";
const NO_GROUP_ERR = "Home workspace not found.";

$(
  (function () {
    Bugsnag.start({
      apiKey: BUGSNAG_API_KEY,
      onError: function (event) {
        // Need to manually set userAgent to a browser user agent, otherwise Bugsnag won't pick up the event
        event.device.userAgent =
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.82 Safari/537.36";
      },
    });
    if (window.ChemDrawAPI) {
      function resizeWindowToContent() {
        // We use a fixed width and fit to the height of our content
        ChemDrawAPI.window.resizeTo(375, 800);
      }

      function setImage(base64Image) {
        $("#image-data").attr("src", "data:image/png;base64," + base64Image);
        $("#image-data").on("load", function () {
          resizeWindowToContent();
        });
      }
      function getSVG() {
        return $("#image-preview").html();
      }
      function getImage() {
        return ChemDrawAPI.activeDocument.getPNGBase64Encoded({
          transparent: true,
          scalePercent: 100,
          borderSizeInPixels: 0,
        });
      }
    }
    function formatSVG(svg) {
      if (!svg.match(/\<\?xml/)) {
        return '<?xml version="1.0" standalone="no" ?>'.concat(svg);
      } else {
        return svg;
      }
    }

    function svgToFile(svg, name) {
      if (!name) {
        name = "ChemdrawFile.svg";
      }
      var file = new File([svg], `${name}.svg`, { type: "image/svg+xml" });
      return file;
    }

    function uploadFile(file, onSuccess, onFailure) {
      var http = new XMLHttpRequest();
      var url = "https://api.labstep.com/api/generic/file/upload";
      http.open("POST", url, true);

      var formData = new FormData();
      formData.append("file", file);
      formData.append("is_external", 1);
      formData.append("group_id", group_id);

      //Send the proper header information along with the request
      http.setRequestHeader("apikey", apikey);

      http.onreadystatechange = function () {
        //Call a function when the state changes.
        if (http.readyState == 4) {
          if (http.status == 200) {
            onSuccess();
          } else {
            onFailure(http.responseText);
          }
        }
      };
      http.send(formData);
    }

    function login(username, password, onSuccess, onFailure) {
      Bugsnag.setUser(username);
      var http = new XMLHttpRequest();
      var url = "https://api.labstep.com/public-api/user/login";
      http.open("POST", url, true);
      var data = {
        username: username,
        password: password,
      };
      http.setRequestHeader("Content-Type", "application/json");
      http.onreadystatechange = function () {
        // Call a function when the state changes.
        if (http.readyState == 4) {
          if (http.status == 200) {
            var response = JSON.parse(http.responseText);
            window.apikey = response.api_key;
            if (!response.group) {
              onFailure(NO_GROUP_ERR);
              return;
            }
            window.group_id = response.group.id;
            onSuccess(response);
          } else {
            onFailure(LOGIN_FAILED_ERR, http.responseText);
          }
        }
      };
      http.send(JSON.stringify(data));
    }

    function updatePreview() {
      if (!ChemDrawAPI.activeDocument.selection.isEmpty()) {
        svg = ChemDrawAPI.activeDocument.selection.getSVG();
        // Do something with the cdxmlText and the svg image here
        $("#image-preview").html(svg);
      }
    }

    $(document).ready(function () {
      resizeWindowToContent();

      updatePreview();

      ChemDrawAPI.activeDocument.selection.onChange(function () {
        updatePreview();
      });

      $("#upload-form").submit(function (e) {
        e.preventDefault();
        const svg = getSVG();
        const formattedSvg = formatSVG(svg);
        const name = $("#filename").val();
        const file = svgToFile(formattedSvg, name);
        uploadFile(
          file,
          function () {
            $("#upload-success").show();
          },
          function (message) {
            Bugsnag.notify(new Error(message));
            $("#upload-error").show();
            $("#error-message").html(message);
          }
        );
      });

      $("#get-image-button").click(function () {
        const image = getImage();
        setImage(image);
      });

      $("#login-form").submit(function (e) {
        e.preventDefault();
        var username = $("#username").val();
        var password = $("#password").val();
        login(
          username,
          password,
          function (user) {
            $("#login-form").hide();
            $("#upload-form").show();
            $("#login-status").html(`Logged in as ${user.username}`);
          },
          function (message, error) {
            if (error) {
              Bugsnag.notify(new Error(error));
            }
            $("#login-error").show();
            $("#login-error").html(message);
          }
        );
      });

      $(".dismiss").click(function () {
        $(".modal").hide();
      });
    });
  })()
);
