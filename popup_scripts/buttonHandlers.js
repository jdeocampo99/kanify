import { apifunction, createRequest } from "./apifunction.js";
import {
  apiInputRenderer,
  settingsInputRenderer,
  apiInputRemover,
  kanifyClicker
} from "./interface_renderer.js";

/*On submit button, authorize users API key */
export function onAPIInputSubmit() {

  //Check chrome storage to see if user has input the api token in before
  chrome.storage.local.get("user_token", function (data) {
    var apiToken;
    //if user has not put in the api token, add it to the storage
    if (!data["user_token"]) {
      //SAVE USERS DEFAULT SETTINGS TO CHROME STORAGE HERE
      chrome.storage.local.set({ page_refresh: false, first_login: true })
      //Save api token
      apiToken = document.getElementById("API-Input").value;
      chrome.storage.local.set({ user_token: apiToken });
      //console.log("We just saved your token: " + apiToken);
    }
    //if user has already put in api token, just use what is in storage
    else {
      apiToken = data.user_token;
      /*console.log(
        "Your token has been loaded from storage: " + String(data.user_token)
      );*/
    }

    ///////////////////////////////////////////////////////////////////
    chrome.storage.local.get(["last_modified_user", "first_login"], function (data) {
      var appendable_user;
      //if last modified date exists in storage, append it to the request header
      if (data.last_modified_user) {
        appendable_user = data.last_modified_user;
      } else {
        appendable_user = null;
      }
      //Saving desired API endpoints, to variables
      var apiSubjectEndPointPath_1 = "subjects?page_after_id=439";
      var apiSubjectEndPointPath_2 = "subjects?page_after_id=1439";
      var apiUserEndPointPath = "user";
      //Creating request objects with given endpoints
      var apiSubjectEndpoint_1 = createRequest(
        apiSubjectEndPointPath_1,
        apiToken,
        null
      );
      var apiSubjectEndpoint_2 = createRequest(
        apiSubjectEndPointPath_2,
        apiToken,
        null
      );
      var apiUserEndpoint = createRequest(
        apiUserEndPointPath,
        apiToken,
        appendable_user
      );
      //Making calls to subject/user endpoints
      Promise.all([
        fetch(apiSubjectEndpoint_1),
        fetch(apiSubjectEndpoint_2),
        fetch(apiUserEndpoint),
      ])
        .then(async ([subject_1, subject_2, user]) => {
          //adding last modified-dates to storage
          chrome.storage.local.set({
            last_modified_user: user.headers.get("last-modified"),
            last_modified_subject_1: subject_1.headers.get("last-modified"),
            last_modified_subject_2: subject_2.headers.get("last-modified"),
          });
          //If 401, user did not enter valid api key, so remove it from storage and let them try again
          if (user.status === 401) {
            if (!document.getElementById("Invalid-Box")) {
              var newDiv = document.createElement("div");
              newDiv.id = 'Invalid-Box'
              newDiv.textContent = "You did not enter a valid API key! Please try again"; // adds a div with this on it ${res.count}
              newDiv.style = 'margin-top: .3em; text-align: center; font-family: \'Varela Round\', sans-serif;';
              var currentDiv = document.getElementById("Version-Container");
              currentDiv.parentNode.insertBefore(newDiv, currentDiv);
              chrome.storage.local.remove("user_token");
            }
            return [];
            //if 304, user data has not changed since last API access, so do not make any api calls
          } else if (user.status === 304) {
            chrome.storage.local.set({ first_login: false })
            //console.log("Made 0 API calls!");

            return [];
          }
          else if (user.status === 429) {
            //console.log("You made too many requests!")
            return [];
          }
          //else, retrieve the user's information from the api
          else {
            //Alert the user with a success if it is the first time they open kanify
            if (data.first_login == true) {
              if (document.getElementById("Invalid-Box")) {
                var element = document.getElementById("Invalid-Box")
                element.parentNode.removeChild(element)
              }

              var newDiv = document.createElement("div");

              newDiv.textContent = "Successful! You are now ready to use Kanify. Please refresh the page to begin using"; // adds a div with this on it ${res.count}
              newDiv.style = 'margin-top: .3em; margin-left: 1em; margin-right: 1em; text-align: center; font-family: \'Varela Round\', sans-serif; font-size: 1.2em';
              //var currentDiv = document.getElementById("Info-Box");
              var currentDiv = document.getElementById("Version-Container");
              currentDiv.parentNode.insertBefore(newDiv, currentDiv);
              //alert("Successful! You are now ready to use Kanify. Please refresh the page to begin using");

            }


            //destructuring promises and jsonify the body of data
            const user_data = await user.json();
            const subject_data_1 = await subject_1.json();
            const subject_data_2 = await subject_2.json();

            return [subject_data_1, subject_data_2, user_data, user.status]; //return an array of jsons
          }
        })
        .then(apifunction) //call api function to save data to storage*/
        .then((status_code) => {
          //if the user correctly put their api key in, render the correct html in the popup for usage
          /*
          if (status_code === 200) {
            settingsInputRenderer();
            if (document.getElementById('API-Input')) {
              apiInputRemover();
            }
          }*/
        });
    });
  });
}

//On  click, send message to content script to perform highlight kanji functions
export const onKanifyClick = () => {
  chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
    //sends the content of the current tab to the content script
    chrome.tabs.sendMessage(tabs[0].id, tabs[0].url);
  });
};

//Handles the toggling for the page refresh function
export function onRefreshToggle(e) {
  chrome.storage.local.get("page_refresh", function (storage_data) {
    //Save the current state of the checkbox to storage
    let enableRefresh = document.getElementById("Page-Refresh").checked
    chrome.storage.local.set({ page_refresh: enableRefresh })
  })

}