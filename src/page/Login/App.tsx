import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Button, Segment, Input } from 'semantic-ui-react';
import styled from 'styled-components';
import Image from '../../../public/img/Background.jpg';

const electron = window.require('electron');
const { ipcRenderer } = electron;

const Main = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
`;

const Background = styled.div`
  background-image: url(${Image});
  background-size: cover;
  width: 100vw;
  height: 100vh;
  background-repeat: no-repeat;
`;

const Form = styled.div`
    margin: 50px 75px 50px 75px;
`;


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
        ipcRenderer.send('DeviceRegister', info);
    }

    ipcRenderer.on('LoginResult', (event, argument) => {
        if (argument.status === true) history.push({ pathname: '/device', state: { form: info } });
        else alert('Login Failed')
    });
    ipcRenderer.on('AlreadyLogin', (event, argument) => {
        if (!argument.code) history.push({ pathname: '/main', state: { userId: argument.userId, username: argument.name } });
    });

    return (
        <Background>
            <Main>
                <Segment>
                    <Form>
                        <h1>로그인</h1>
                        <Input name="email" onChange={onChangeInput} value={info.email} /><br/>
                        <Input name="password" type="password" onChange={onChangeInput} value={info.password}/><br/><br/>
                        <Button onClick={() => send()}>전송</Button>
                    </Form>
                </Segment>
            </Main>
        </Background>
    )
}

export default App;