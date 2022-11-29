import 'regenerator-runtime/runtime';

const scriptInjection = document.createElement('script');
scriptInjection.src = chrome.runtime.getURL('app/script/inpage.js');
(document.head || document.documentElement).appendChild(scriptInjection);

scriptInjection.onload = () => {
  const extensionURL = chrome.runtime.getURL('popup.html');

  const event = new CustomEvent('onloadInject', { detail: { extensionURL } });
  document.dispatchEvent(event);
};

// Long-life connection to background
let port = {};

let setupPort = function () {
  port = chrome.runtime.connect({ name: 'kda.extension' });
  port.onMessage.addListener(async (data) => {
    window.postMessage({
      ...data,
      target: 'kda.dapps',
    });
    return true;
  });
  port.onDisconnect.addListener(() => {
    setupPort();
  });
};

setupPort();
// Listen webpage(dapps) message
window.addEventListener(
  'message',
  (event) => {
    if (event.source !== window) return;

    const { data } = event;
    console.log(`-----CONTENT---`, Date.now());
    if (data.target && data.target === 'kda.content') {
      console.log(`🚀 !!! ~ data`, data);
      try {
        port.postMessage({
          ...data,
          target: 'kda.background',
        });
      } catch (err) {
        try {
          setupPort();
          port.postMessage({
            ...data,
            target: 'kda.background',
          });
        } catch (err) {
          console.log(err);
        }
      }
    }
  },
  false,
);
