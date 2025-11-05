import './index.css'
import App from './App.jsx'
import ReactDOM from 'react-dom/client';
import {Provider} from 'react-redux';
import store from './Store/index.js';

ReactDOM.createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <App />
  </Provider>
)
