import React, {useState, useEffect, useRef} from 'react';
import {Comment, Input, List, Button, Form, Segment, Rail} from 'semantic-ui-react';
import styled from "styled-components";
import {Long} from "bson";
import {useLocation} from "react-router-dom";
import { saveAs } from 'file-saver';

import {ChatStruct, ChannelStruct, MyProfileStruct} from '../../types/Message';
import noProfile from '/public/img/user.png';
import {bool} from "prop-types";

const ChannelList = styled.div`
  width: 40%;
  padding: 20px;
`;

const ChannelListSegment = styled(Segment)`
  width: 100%;
  height: 100%;
  overflow: scroll;
  overflow-x: hidden;
`;

const Chatting = styled.div`
  width: 100%;
  height: 100%;
`;

const Wrapper = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  position: fixed;
`;

const MyComment = styled(Comment)`
  text-align: right;
`;

const ChatWrapper = styled.div`
  width: 100%;
`;

const ChattingWindow = styled.div`
  overflow: scroll;
  height: calc(100% - 100px);
  overflow-x: hidden;
  width: 100%;
  padding: 30px 30px 15px 30px;
`;

const InputArea = styled.div`
  width: 100%;
  height: 100px;
  display: flex;
  padding: 20px 20px 20px 20px;
`

const InputForm = styled(Form)`
  width: 100%;
  height: 100%;
`;

const InputFormTextArea = styled(Form.TextArea)`
  width: 100%
  //height: 100%;
`;

const SendButton = styled.div`
  padding: 0 10px 0 10px;
  width: 150px;
`;

const Emoticon = styled.img`
    width: 130px;
    height: 130px;
`;

const Image = styled.img`
    width: 30%;
`;

const electron = window.require('electron');
const {ipcRenderer} = electron;

function App() {
    const [users, setUsers] = useState<ChannelStruct[]>([]);
    const [chats, setChats] = useState<ChatStruct[]>([]);
    const [message, setMessage] = useState<string>();
    const [channelId, setChannelId] = useState<Long>();
    const [download, setDownload] = useState<{ fileName: string, data: Uint8Array }>();
    const [profile, setProfile] = useState<MyProfileStruct>()
    const location = useLocation<Record<string, unknown>>();
    const chatEndRef = useRef<HTMLInputElement>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        ipcRenderer.send('ChannelList');
        ipcRenderer.send('GetMyProfile');
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView();
    }, [chats]);

    useEffect(() => {
        ipcRenderer.send('GetChatList', { channelId });
    }, [channelId]);

    useEffect(() => {
        if (download) {
            const blob = new Blob([download.data], { type: 'application/octet-stream' });
            saveAs(blob, download.fileName);
        }
    }, [download]);

    ipcRenderer.removeAllListeners('LoginResult');
    ipcRenderer.removeAllListeners('AlreadyLogin');
    ipcRenderer.removeAllListeners('NewChat');
    ipcRenderer.removeAllListeners('GetMyProfile');
    ipcRenderer.removeAllListeners('GetMyProfileResult');
    ipcRenderer.removeAllListeners('GetChatList');
    ipcRenderer.removeAllListeners('ChannelResponse');
    ipcRenderer.removeAllListeners('GetChatListResult');
    ipcRenderer.removeAllListeners('ReceiveData');
    ipcRenderer.removeAllListeners('ReceiveDataResult');

    ipcRenderer.on('ChannelResponse', (event, argument) => {
        setUsers(argument);
    });

    ipcRenderer.on('NewChat', (event, argument) => {
        const localChannelId = JSON.stringify(channelId);
        const receivedChannelId = JSON.stringify(argument.channelId);
        let isExist = false;

        users.some(elem => {
            if (localChannelId === JSON.stringify(elem.info.channelId)) return true;
        });

        if (!isExist) ipcRenderer.send('ChannelList');

        if (localChannelId === receivedChannelId) {
            setChats([...chats, argument]);
        }
    });

    ipcRenderer.on('GetChatListResult', (event, argument: ChatStruct[]) => {
        setChats(argument);
    });

    ipcRenderer.on('GetMyProfileResult', (event, argument: MyProfileStruct) => {
        setProfile(argument);
    });

    const sendMessage = (filePath?: Record<string, unknown>) => {
        ipcRenderer.send('SendMessage', { channelId, message, filePath });
        setMessage('');
    }

    const sendMsgViaEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key == 'Enter')
            sendMessage();
    }

    const onMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMessage(e.target.value);
    };

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            sendMessage({
                filePath: e.target.files[0].path,
                fileSize: e.target.files[0].size,
            });
        } else {
            alert('파일을 선택하지 않았습니다.');
        }
    }

    const downloadFile = (type: number, key: string, size: number, fileName: string) => {
        const buffer = new ArrayBuffer(size);
        const data = new Uint8Array(buffer);

        ipcRenderer.on('ReceiveDataResult', (event, argument: { buffer: Uint8Array, end: boolean, offset: number }) => {
            data.set(argument.buffer, argument.offset);
            if (argument.end) setDownload({ data, fileName });
        });

        alert('다운로드를 시작합니다.');
        ipcRenderer.send('ReceiveData', { type, key, channelId });
    }

    return (
        <Wrapper>
            <ChannelList>
                <ChannelListSegment>
                    <List divided relaxed>
                        {
                            users.map((elem: ChannelStruct) => {
                                return (
                                    <List.Item onClick={() => setChannelId(elem.info.channelId)}>
                                        <List.Header>{elem.name}</List.Header>
                                    </List.Item>
                                )
                            })
                        }
                    </List>
                </ChannelListSegment>
            </ChannelList>
            <Chatting>
                <ChattingWindow>
                    <Comment.Group>
                        {
                            chats.map((elem: ChatStruct) => {
                                if (elem.senderInfo.isMine) {
                                    return (
                                        <ChatWrapper>
                                            <MyComment>
                                                <MyComment.Content>
                                                    <Comment.Author>{elem.senderInfo.name}</Comment.Author>
                                                    <Comment.Text>
                                                        {
                                                            elem.emoticonImg ?
                                                                <Emoticon src={elem.emoticonImg} alt="카카오 이모티콘" /> :
                                                                (
                                                                    elem.attachedImg ?
                                                                        <Image src={elem.attachedImg} /> :
                                                                        <div>{elem.data}</div>
                                                                )
                                                        }
                                                        {
                                                            elem.attachedFileData ?
                                                                <a onClick={() => downloadFile(
                                                                    elem.attachedFileData!.type,
                                                                    elem.attachedFileData!.key,
                                                                    elem.attachedFileData!.size,
                                                                    elem.data
                                                                )}>다운로드</a> :
                                                                <div />
                                                        }
                                                    </Comment.Text>
                                                </MyComment.Content>
                                            </MyComment>
                                        </ChatWrapper>
                                    )
                                } else {
                                    return (
                                        <ChatWrapper>
                                            <Comment>
                                                {
                                                    elem.senderInfo.profileURL !== '' ?
                                                        <Comment.Avatar src={elem.senderInfo.profileURL}/> :
                                                        <Comment.Avatar src={noProfile}/>
                                                }
                                                <Comment.Content>
                                                    <Comment.Text>
                                                    <Comment.Author>{elem.senderInfo.name}</Comment.Author>
                                                        {
                                                            elem.emoticonImg ?
                                                                <Emoticon src={elem.emoticonImg} alt="카카오 이모티콘" /> :
                                                                (
                                                                    elem.attachedImg ?
                                                                        <Image src={elem.attachedImg} /> :
                                                                        <div>{elem.data}</div>
                                                                )
                                                        }
                                                        {
                                                            elem.attachedFileData ?
                                                                <a onClick={() => downloadFile(
                                                                    elem.attachedFileData!.type,
                                                                    elem.attachedFileData!.key,
                                                                    elem.attachedFileData!.size,
                                                                    elem.data
                                                                )}>다운로드</a> :
                                                                <div />
                                                        }
                                                    </Comment.Text>
                                                </Comment.Content>
                                            </Comment>
                                        </ChatWrapper>
                                    )
                                }
                            })
                        }
                        <div ref={chatEndRef} />
                    </Comment.Group>
                </ChattingWindow>

                    <InputArea>
                        <InputForm onKeyPress={sendMsgViaEnter} onSubmit={() => sendMessage()}>
                            <InputFormTextArea onChange={onMessageChange} value={message}/>
                        </InputForm>
                        <SendButton>
                            <Button>제출</Button>
                            <Button onClick={() => fileRef.current?.click()} type='file' icon='upload'/>
                            <input ref={fileRef} type='file' style={{display: 'none'}} onChange={onFileChange} />
                            <Button icon='star' />
                        </SendButton>
                    </InputArea>

            </Chatting>
        </Wrapper>
    )
}

export default App;