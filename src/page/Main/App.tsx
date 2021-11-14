import React, {useState, useEffect, useRef, useMemo} from 'react';
import {Comment, Input, List, Button, Form, Segment, Rail, Icon, Header} from 'semantic-ui-react';
import styled from "styled-components";
import {Long} from "bson";
import {useLocation} from "react-router-dom";
import { saveAs } from 'file-saver';
import Image from '../../../public/img/Background.jpg';
import ChatItem from "./component/ChatItem";


import {ChatStruct, ChannelStruct, MyProfileStruct} from '../../types/Message';
import noProfile from '/public/img/user.png';

const ChannelList = styled.div`
  width: 30%;
  padding: 10px 10px 10px 10px;
`;

const ChannelListSegment = styled(Segment)`
  width: 100%;
  height: 100%;
  overflow: scroll;
  overflow-x: hidden;
`;

const ChattingSegment = styled(Segment)`
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const MainSegment = styled(Segment)`
  width: 100%;
  height: 100%;
  min-width: 800px;
  min-height: 600px;
  max-width: 1000px;
  max-height: 800px;
  overflow: hidden;
  display: flex;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
`;

const Chatting = styled.div`
  width: 70%;
  height: 100%;
  padding: 10px;
`;

const Wrapper = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  position: fixed;
  background-image: url(${Image});
  background-size: cover;
  background-repeat: no-repeat;
`;

const MyComment = styled(Comment)`
  text-align: right;
`;

const ChatWrapper = styled.div`
  width: 100%;
  max-width: 100%;
  padding: 10px;
`;

const ChattingWindow = styled.div`
  overflow: scroll;
  height: calc(100% - 80px);
  overflow-x: hidden;
  width: 100%;
  padding: 10px 10px 10px 0;
`;

const InputArea = styled.div`
  width: 100%;
  display: flex;
  padding: 10px 0 0 0;
`;

const InputForm = styled(Form)`
  width: calc(100% - 100px);
`;

const ButtonGroup = styled.div`
  width: 100px;
  padding: 0 0 0 20px;
`;

const SendButton = styled(Button)`
  width: 80px;
`;

const SendBtnGroup = styled(Button.Group)`
  width: 80px;  
`;

const SendButtonWrapper = styled.div`
  margin-bottom: 3px;  
`;

const NoticeChannel = styled.div`
  margin: auto;
`;

const ChannelName = styled(List.Header)`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
`;

const ChannelNameOnChatList = styled.h3`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
`;

const electron = window.require('electron');
const {ipcRenderer} = electron;

function App() {
    const [users, setUsers] = useState<ChannelStruct[]>([]);
    const [chats, setChats] = useState<ChatStruct[]>([]);
    const [message, setMessage] = useState<string>();
    const [channel, setChannel] = useState<{ channelId: Long, name: string }>();
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
        ipcRenderer.send('GetChatList', { channelId: channel?.channelId });
    }, [channel?.channelId]);

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
        const localChannelId = JSON.stringify(channel?.channelId);
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
        ipcRenderer.send('SendMessage', { channelId: channel?.channelId, message, filePath });
        setMessage('');
    }

    const sendMsgViaEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key == 'Enter')
            sendMessage();
    }

    const onMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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
        ipcRenderer.send('ReceiveData', { type, key, channelId: channel?.channelId });
    }

    return (
        <Wrapper>
            <MainSegment>
            <ChannelList>
                <ChannelListSegment>
                    <List divided relaxed>
                        {
                            users.map((elem: ChannelStruct) => {
                                return (
                                    <List.Item onClick={() => setChannel({
                                        channelId: elem.info.channelId,
                                        name: elem.name
                                    })}>
                                        <ChannelName>{elem.name}</ChannelName>
                                    </List.Item>
                                )
                            })
                        }
                    </List>
                </ChannelListSegment>
            </ChannelList>
            <Chatting>
                {
                    channel?.channelId?
                        <ChattingSegment>
                            <ChannelNameOnChatList>
                                {channel.name}
                            </ChannelNameOnChatList>
                            <ChattingWindow>
                                <Comment.Group>
                                    {
                                        chats.map((elem: ChatStruct) => {
                                            if (elem.senderInfo.isMine) {
                                                return (
                                                    <ChatWrapper>
                                                        <Segment>
                                                            <MyComment>
                                                                <MyComment.Content>
                                                                    <ChatItem elem={elem} downloadFile={downloadFile}/>
                                                                </MyComment.Content>
                                                            </MyComment>
                                                        </Segment>
                                                    </ChatWrapper>
                                                )
                                            } else {
                                                return (
                                                    <ChatWrapper>
                                                        <Segment>
                                                            <Comment>
                                                                {
                                                                    elem.senderInfo.profileURL !== '' ?
                                                                        <Comment.Avatar src={elem.senderInfo.profileURL}/> :
                                                                        <Comment.Avatar src={noProfile}/>
                                                                }
                                                                <Comment.Content>
                                                                    <ChatItem elem={elem} downloadFile={downloadFile} />
                                                                </Comment.Content>
                                                            </Comment>
                                                        </Segment>
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
                                    <Form.TextArea onChange={onMessageChange} value={message}/>
                                </InputForm>
                                <input ref={fileRef} type='file' style={{display: 'none'}} onChange={onFileChange} />
                                <ButtonGroup>
                                    <SendButtonWrapper>
                                        <SendButton onClick={() => sendMessage()}>전송</SendButton>
                                    </SendButtonWrapper>
                                    <SendBtnGroup>
                                        <Button onClick={() => fileRef.current?.click()} type='file' icon='upload'/>
                                        <Button icon='star' />
                                    </SendBtnGroup>
                                </ButtonGroup>
                            </InputArea>
                        </ChattingSegment> :
                        <ChattingSegment verticalAlign='middle'>
                            <NoticeChannel>
                                <Header icon>
                                    <Icon name='chat'/>
                                    채널을 선택 해 주세요.
                                </Header>
                            </NoticeChannel>
                        </ChattingSegment>
                }
            </Chatting>
            </MainSegment>
        </Wrapper>
    )
}

export default App;