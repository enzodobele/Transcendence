importScripts('/stockfish-18-lite-single.js');

Stockfish().then(stockfish => {

  // Stockfish → React
  stockfish.addMessageListener(msg => {
    postMessage(msg);
  });

  // React → Stockfish  
  onmessage = e => {
    stockfish.postMessage(e.data);
  };

});