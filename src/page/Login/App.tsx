import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Button } from 'semantic-ui-react';
const electron = window.require('electron');
const { ipcRenderer } = electron;

const App = () => {
    const history = useHistory();
    const [info, setInfo] = useState({
        email: '',
        password: ''
    });

    ipcRenderer.removeAllListeners('LoginResult');
    ipcRenderer.removeAllListeners('AlreadyLogin');

    function onChangeInput(e: React.ChangeEvent<HTMLInputElement>) {
        setInfo({
            ...info,
            [e.target.name]: e.target.value
        });
    }

    function send() {
        console.log(info);
        ipcRenderer.send('DeviceRegister', info);
    }

    ipcRenderer.on('LoginResult', (event, argument) => {
        if (argument.status === true) history.push({ pathname: '/code', state: { form: info } });
        else alert('Login Failed')
    });
    ipcRenderer.on('AlreadyLogin', (event, argument) => {
        if (!argument.code) history.push({ pathname: '/main', state: { userId: argument.userId, username: argument.name } });
    });

    return (
        <div>
            <input name="email" onChange={onChangeInput} value={info.email} />
            <input name="password" type="password" onChange={onChangeInput} value={info.password}/>
            <Button onClick={() => send()}>전송</Button>
        </div>
    )
}

export default App;