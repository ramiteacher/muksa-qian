import React, { createContext } from 'react';

const SocketContext = createContext({
  socket: null,
  setSocket: () => {}
});

export default SocketContext;
