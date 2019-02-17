importScripts('https://storage.googleapis.com/workbox-cdn/releases/3.5.0/workbox-sw.js');

if (workbox) {
    const queue = new workbox.backgroundSync.Queue('pwaDemoQueue');
    console.log(`Yay! Workbox is loaded 🎉`);
    workbox.precaching.precacheAndRoute([
  {
    "url": "style/main.css",
    "revision": "422b40f348c6e139889d269b67bbc62c"
  },
  {
    "url": "index.html",
    "revision": "34889465eb667a5c50f684ddf0cc70e1"
  },
  {
    "url": "js/idb-promised.js",
    "revision": "59df18a7433f090282337136440403f7"
  },
  {
    "url": "js/main.js",
    "revision": "bdd9c8e9f557cc427216afc19786e9d9"
  },
  {
    "url": "images/fav.jpg",
    "revision": "76c31d2c77b6588ee0e54ffd02d7f770"
  },
  {
    "url": "images/logo .jpg",
    "revision": "8b865c07f6db6b1cf284eafde45b73df"
  },
  {
    "url": "images/save_square.png",
    "revision": "29ae56b22f2af8aebe09e427a34ef883"
  },
  {
    "url": "images/Thumbs.db",
    "revision": "551693580bf0e43262fe9c308126b1fa"
  },
  {
    "url": "manifest.json",
    "revision": "9f4bf5823a2e26cb96e141fe874db3e8"
  }
]);

    const showNotification = () => {
        self.registration.showNotification('Background sync complete!!!', {
            body: 'App is online now'
        });
    };

    const bgSyncPlugin = new workbox.backgroundSync.Plugin(
        'dashboardr-queue', {
            callbacks: {
                queueDidReplay: showNotification
                    // other types of callbacks could go here
            }
        }
    );

    const networkWithBackgroundSync = new workbox.strategies.NetworkOnly({
        plugins: [bgSyncPlugin],
    });

    workbox.routing.registerRoute(
        /\/api\/add/,
        networkWithBackgroundSync,
        'POST'
    );

    self.addEventListener('fetch', (event) => {
        console.log('Fetch Called from sw');
        // Clone the request to ensure it's save to read when
        // adding to the Queue.
    const promiseChain = fetch(event.request.clone())
        .catch((err) => {
          return queue.addRequest(event.request);
    });

  event.waitUntil(promiseChain);
});
} else {
    console.log(`Boo! Workbox didn't load 😬`);
}