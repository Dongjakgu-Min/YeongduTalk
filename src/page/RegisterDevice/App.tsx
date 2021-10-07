import React, { useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
const electron = window.require('electron');
const { ipcRenderer } = electron;

function App () {
    const [passcode, setPassCode] = useState('');
    const history = useHistory();
    const location = useLocation<Record<string, unknown>>();

    const onCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassCode(e.target.value);
    }

    const submitCode = () => {
        ipcRenderer.send('Register', { form: location.state.form, passcode })
        ipcRenderer.on('RegisterResult', (event, argument) => {
            if (!argument.status) alert('Register Failed');
        });
    }

    return (
        <div>
            <input onChange={onCodeChange} value={passcode} />
            <button onClick={() => submitCode()}>코드 제출</button>
        </div>
    )
}

export default App;