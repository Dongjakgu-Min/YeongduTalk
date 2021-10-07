import React from 'react';
import ReactDOM from 'react-dom';

import App from './App';
import {HashRouter} from "react-router-dom";

import 'semantic-ui-css/semantic.min.css';

const rootElement = document.getElementById('root');

ReactDOM.render(
    <React.StrictMode>
        <HashRouter>
            <App />
        </HashRouter>
    </React.StrictMode>
    , rootElement);
