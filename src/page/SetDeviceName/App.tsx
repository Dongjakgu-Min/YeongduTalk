import React, { useState } from "react";
import styled from 'styled-components';
import { useHistory, useLocation } from 'react-router-dom';
import {Button, Input, Segment} from 'semantic-ui-react';

const electron = window.require('electron');
const { ipcRenderer } = electron;

const Main = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
`;


const Form = styled.div`
  margin: 50px 75px 50px 75px;
`;

const App = () => {
    const [name, setName] = useState<string>();
    const [error, setError] = useState<string>();

    const history = useHistory();
    const location = useLocation<Record<string, Record<string, unknown>>>();

    ipcRenderer.removeAllListeners('LoginResult');

    const onNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setName(e.target.value);
    }

    const setDeviceInfo = () => {
        ipcRenderer.send('DeviceRegister', {...location.state.form, username: name});
    }

    ipcRenderer.on('LoginResult', (event, argument) => {
        if (argument.status === true)
            history.push({ pathname: '/code', state: { form: location.state.form }});
        else
            alert('로그인에 실패하였습니다.');
    });

    return (
        <Main>
            <Segment>
                <Form>
                    <h2>기기 등록</h2>
                    <p>기기 목록에 사용될 이름을 정해 주세요.</p>
                    <Input onChange={onNameChange} value={name}/><br/><br/>
                    <Button onClick={() => setDeviceInfo()}>다음</Button>
                </Form>
            </Segment>
        </Main>
    )
}

export default App;