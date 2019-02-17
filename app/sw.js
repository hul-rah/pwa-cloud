importScripts('https://storage.googleapis.com/workbox-cdn/releases/3.5.0/workbox-sw.js');

if (workbox) {
    const queue = new workbox.backgroundSync.Queue('pwaDemoQueue');
    console.log(`Yay! Workbox is loaded 🎉`);
    workbox.precaching.precacheAndRoute([]);

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