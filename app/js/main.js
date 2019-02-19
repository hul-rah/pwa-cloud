if ('serviceWorker' in navigator) { 
    window.addEventListener('load', () => {  
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log(`Service Worker registed! Scope: ${registration.scope}`);
            })
            .catch(err => {
                console.log(`Service Worker registration failed: ${err}`);
            }); 
    });
}
var isLoading = true,
    spinner = document.querySelector('.loader'),
    flag = true,
    containerForLoader = document.querySelector('main');
const container = document.getElementById('container');
const offlineMessage = document.getElementById('offline');
const noDataMessage = document.getElementById('no-data');
const dataSavedMessage = document.getElementById('data-saved');
const saveErrorMessage = document.getElementById('save-error');
const deleteSuccessMessage = document.getElementById('delete-success');
const deleteErrorMessage= document.getElementById('delete-error');
const addEventButton = document.getElementById('add-event-button');

addEventButton.addEventListener('click', addAndPostEvent);

loadingSpinner(false);

Notification.requestPermission();

const dbPromise = createIndexedDB();

loadContentNetworkFirst();

var deferredPrompt;

window.addEventListener('beforeinstallprompt', function (e) {
        console.log('beforeinstallprompt listener initialized ');
        console.log(e);
        // Prevent Chrome 67 and earlier from automatically showing the prompt
        e.preventDefault();
        // Stash the event so it can be triggered later.
        deferredPrompt = e;
        showAddToHomeScreen();
});

function loadContentNetworkFirst() {
    getServerData()
        .then(dataFromNetwork => {
            flag = true;
            updateUI(dataFromNetwork);
            saveUserDataLocally(dataFromNetwork)
                .then(() => {
                    setLastUpdated(new Date());
                    messageDataSaved();
                }).catch(err => {
                    // messageSaveError();
                    console.warn(err);
                });
        }).catch(err => {
            console.log('Network requests have failed, this is expected if offline');
            getLocalUserData()
                .then(offlineData => {
                    if (!offlineData.length) {
                        flag = false;
                        messageNoData();
                    } else {
                        messageOffline();
                        updateUI(offlineData);
                    }
                });
        });
}

/* Network functions */

function getServerData() {
    return fetch('api/getAll').then(response => {
        if (!response.ok) {
            throw Error(response.statusText);
        }
        return response.json();
    });
}



function addAndPostEvent(e) {
    // if (flag) {
    //     $('#data-saved').hide().show('slow').html('Data Saved Successfully').delay(5000).fadeOut();
    // } else {
    //     $('#offline').hide().show('slow').html('Your data is saved and will sync when online').delay(5000).fadeOut();
    // }
    loadingSpinner(true);
    e.preventDefault();
    console.log('Call 2 api/add');
    //debugger;
    const data = {
        id: Date.now(),
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        email: document.getElementById('email').value,
        contact: document.getElementById('contact').value
    };
    updateUI([data]);
    saveUserDataLocally([data]);
    const headers = new Headers({ 'Content-Type': 'application/json' });
    const body = JSON.stringify(data);
    return fetch('api/add', {
        method: 'POST',
        headers: headers,
        body: body
    });
    //    getMaxPk().then((id) => {
    //        const data = {
    //            id: id,
    //            firstName: document.getElementById('firstName').value,
    //            lastName: document.getElementById('lastName').value,
    //            email: document.getElementById('email').value,
    //            contact: document.getElementById('contact').value
    //        };
    //        updateUI([data]);
    //        saveUserDataLocally([data]);
    //        const headers = new Headers({ 'Content-Type': 'application/json' });
    //        const body = JSON.stringify(data);
    //        return fetch('api/add', {
    //            method: 'POST',
    //            headers: headers,
    //            body: body
    //        });
    //    }).catch(err => {
    //        // messageSaveError();
    //        console.warn(err);
    //    });

}

/* UI functions */

function updateUI(users) {
    console.log('Call 3 Update UI');

    users.forEach(user => {
        const item =
            `<tr id='user_'+ ${user.id}>
            <td>${user.firstName}</td>
           <td>${user.lastName}</td>
           <td>${user.email}</td>
           <td>${user.contact}</td>
           <td><i class="fa fa-trash-o" id="deleteUser" onclick="deleteUser(${user.id},this)" style="font-size:20px"></i></td></tr>`;
        usrdata.insertAdjacentHTML('beforeend', item);
    });
}

function messageOffline() {
    // alert user that data may not be current
    const lastUpdated = getLastUpdated();
    if (lastUpdated) {
        offlineMessage.textContent += ' Last fetched server data: ' + lastUpdated;
    }
    offlineMessage.style.display = 'block';
    hideNotificationMessages(offlineMessage);
}

function messageNoData() {
    // alert user that there is no data available
    noDataMessage.style.display = 'block';
    hideNotificationMessages(noDataMessage,3000);
}

function messageDataSaved() {
    // alert user that data has been saved for offline
    const lastUpdated = getLastUpdated();
    if (lastUpdated) { dataSavedMessage.textContent += ' on ' + lastUpdated; }
    dataSavedMessage.style.display = 'block';
    hideNotificationMessages(dataSavedMessage,3000);
}
function messageDeleteSuccess(){
    //alert user that data has been deleted 
    const lastUpdated = getLastUpdated();
    if (lastUpdated) { deleteSuccessMessage.textContent += ' on ' + lastUpdated; }
    deleteSuccessMessage.style.display = 'block';
    hideNotificationMessages(deleteSuccessMessage,3000);
}

function messageSaveError() {
    // alert user that data couldn't be saved offline
    saveErrorMessage.style.display = 'block';
    hideNotificationMessages(saveErrorMessage);
}

function messageDeleteError(){
    //alert user that data couldn't be deleted 
    deleteErrorMessage.style.display = 'block';
    hideNotificationMessages(saveErrorMessage);
}


/* Storage functions */

function getLastUpdated() {
    return localStorage.getItem('lastUpdated');
}

function setLastUpdated(date) {
    localStorage.setItem('lastUpdated', date);
}

function createIndexedDB() {
    if (!('indexedDB' in window)) { return null; }
    return idb.open('pwa', 1, function(upgradeDb) {
        if (!upgradeDb.objectStoreNames.contains('users')) {
            const usersOS = upgradeDb.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
        }
    });
}

function hideNotificationMessages(elementObj,time)
{
    time = time || 5000; 
    setTimeout(function(){
        elementObj.style.display = 'none';
    },time);
}

function saveUserDataLocally(users) {
    if (!('indexedDB' in window)) { return null; }
    return dbPromise.then(db => {
        //debugger;
        const tx = db.transaction('users', 'readwrite');
        const store = tx.objectStore('users');
        return Promise.all(users.map(user => store.put(user)))
            .catch((e) => {
                tx.abort();
                console.error(e);
                throw Error('users were not added to the store');
            });
    });
}

function getLocalUserData() {
    if (!('indexedDB' in window)) { return null; }
    return dbPromise.then(db => {
        const tx = db.transaction('users', 'readonly');
        const store = tx.objectStore('users');
        return store.getAll();
    });
}

function deleteUser(id, a) {
    if (!('indexedDB' in window)) { return null; }
    const data = { id: id };
    const headers = { 'Content-Type': 'application/json' };
    const body = JSON.stringify(data);
    var i = a.parentNode.parentNode.rowIndex;
    document.getElementById('usrdata').deleteRow(i);
    deleteUserFromDb(id);
    return fetch('api/delete', {
        method: 'POST',
        headers: headers,
        body: body
    }).then(function() {
        messageDeleteSuccess();
    }).catch(function(){
        messageDeleteError();
    });
}

function deleteUserFromDb(id) {
    if (!('indexedDB' in window)) { return null; }
    return dbPromise.then(db => {
        debugger;
        var transaction = db.transaction('users', 'readwrite');
        var objectStore = transaction.objectStore('users');
        var objectStoreRequest = objectStore.delete(id);
        transaction.oncomplete = function(event) {
            db.close();
        };
    }).then(function() {
        console.log("deleted successfully");
    }).catch(function(error){
        console.error('Error:', error);
    });
}

function loadingSpinner(load) {
    if (!load) {
        spinner.setAttribute('hidden', true);
        containerForLoader.removeAttribute('hidden');
        isLoading = false;
    }
}

function getMaxPk() {

    return dbPromise.then(db => {
        //debugger;
        var transaction = db.transaction('users', 'readonly');
        var objectStore = transaction.objectStore('users');
        var index = objectStore.index('firstName');
        var openCursorRequest = index.openCursor(null, 'prev');
        var maxId = null;

        openCursorRequest.onsuccess = function(event) {
            if (event.target.result) {
                maxId = event.target.result.value; //the object with max revision
                return maxId;
            }
        };
        transaction.oncomplete = function(event) {
            db.close();

        };
    });



}

function addToHomeScreen() {
        let a2hsBtn = document.querySelector(".ad2hs-prompt");  // hide our user interface that shows our A2HS button
        a2hsBtn.style.display = 'none';  // Show the prompt
        deferredPrompt.prompt();  // Wait for the user to respond to the prompt
        deferredPrompt.userChoice
          .then(function(choiceResult){
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the A2HS prompt');
        } else {
          console.log('User dismissed the A2HS prompt');
        }
        deferredPrompt = null;
      });
}

function showAddToHomeScreen() {
        let a2hsBtn = document.querySelector(".ad2hs-prompt");
        a2hsBtn.style.display = "block";
        a2hsBtn.addEventListener("click", addToHomeScreen);
}




this.addEventListener('activate', function(e) {
    console.log('[ServiceWorker] Activate');
    e.waitUntil(
        caches.keys().then(function(keyList) {
            return Promise.all(keyList.map(function(key) {
                if (key !== cacheName) {
                    console.log('[ServiceWorker] Removing old cache', key);
                    return caches.delete(key);
                }
            }));
        })
    );
    return self.clients.claim();
});