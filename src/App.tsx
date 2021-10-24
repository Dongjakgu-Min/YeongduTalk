import React, { useState } from 'react';
import {BrowserRouter, Route, Switch} from 'react-router-dom';
import Login from './page/Login/App';
import RegisterDevice from './page/RegisterDevice/App';
import Main from './page/Main/App';
import DeviceName from './page/SetDeviceName/App';

const App = () => {
    return (
        <div>
            <Switch>
                <Route exact path="/" component={Login} />
                <Route path="/code" component={RegisterDevice} />
                <Route path="/main" component={Main} />
                <Route path="/device" component={DeviceName} />
            </Switch>
        </div>
    )
}

export default App;