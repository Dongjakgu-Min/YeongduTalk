import React, { useState, useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import styled from "styled-components";
import { Segment, Input, Button } from 'semantic-ui-react';
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

function App () {
    const [passcode, setPassCode] = useState('');
    const history = useHistory();
    const location = useLocation<Record<string, unknown>>();

    ipcRenderer.removeAllListeners('RegisterResult');

    const onCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassCode(e.target.value);
    }

    const submitCode = () => {
        ipcRenderer.send('Register', { form: location.state.form, passcode })
        ipcRenderer.on('RegisterResult', (event, argument) => {
            if (!argument.status) alert('Register Failed');
            else {
                alert('기기 등록이 완료되었습니다. 다시 로그인 해 주세요.');
                history.push('/');
            }
        });
    }

    return (
        <Main>
            <Segment>
                <Form>
                    <h2>인증번호 입력</h2>
                    <p>카카오톡 인증 번호를 발송하였습니다. 수신 받은 인증번호를 입력 해 주세요.</p>
                    <Input onChange={onCodeChange} value={passcode} /><br/><br/>
                    <Button onClick={() => submitCode()}>코드 제출</Button>
                </Form>
            </Segment>
        </Main>
    )
}

export default App;