import React, {useState, useEffect, useRef} from 'react';
import {NormalChannelInfo} from "node-kakao";
import {Comment, Input, List, Button, Form, TextArea} from 'semantic-ui-react';
import styled from "styled-components";
import {Long} from "bson";
import {useLocation} from "react-router-dom";
import {ChannelInfo} from "../../types/Channel";

import {ChatStruct, ChannelStruct, MyProfileStruct} from '../../types/Message';
import {getChatList} from "../../action/Room";
import noProfile from '/public/img/user.png';

const ChannelList = styled.div`
  width: 40%;
  overflow: scroll;
  overflow-x: hidden;
`;

const Chatting = styled.div`
  width: 60%;
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
`;

const InputArea = styled.div`
  width: 100%;
  height: 100px;
  display: flex;
  border: black;
`

const InputForm = styled(TextArea)`
  width: calc(100% - 50px);
  height: 100%;
`;

const SendButton = styled(Button)`
  width: 100px;
  height: 100%;
`;

const electron = window.require('electron');
const {ipcRenderer} = electron;

function App() {
    const [users, setUsers] = useState<ChannelStruct[]>([]);
    const [chats, setChats] = useState<ChatStruct[]>([]);
    const [message, setMessage] = useState<string>();
    const [channelId, setChannelId] = useState<Long>();
    const [profile, setProfile] = useState<MyProfileStruct>()
    const location = useLocation<Record<string, unknown>>();
    const chatEndRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        ipcRenderer.send('ChannelList');
        ipcRenderer.send('GetMyProfile');
    }, []);

    useEffect(() => {
    }, [chats]);

    useEffect(() => {
        ipcRenderer.send('GetChatList', { channelId });
        scrollToBottom();
    }, [channelId]);

    ipcRenderer.removeAllListeners('NewChat');
    ipcRenderer.removeAllListeners('GetMyProfile');
    ipcRenderer.removeAllListeners('GetChatList');
    ipcRenderer.removeAllListeners('ChannelResponse');
    ipcRenderer.removeAllListeners('GetChatListResult');

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

        if (JSON.stringify(channelId) === JSON.stringify(argument.channelId)) {
            setChats([...chats, argument]);
        }
    });

    ipcRenderer.on('GetChatListResult', (event, argument: ChatStruct[]) => {
        setChats(argument);
    });

    ipcRenderer.on('GetMyProfileResult', (event, argument: MyProfileStruct) => {
        setProfile(argument);
    })

    const sendMessage = () => {
        ipcRenderer.send('SendMessage', { channelId, message });
        const newChat = {
            channelId,
            senderInfo: {
                senderId: profile?.userId,
                name: profile?.username,
                profileURL: '',
                isMine: true
            },
            data: message
        }

        setChats([...chats, newChat as ChatStruct])
    }

    const onMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMessage(e.target.value);
    };

    const scrollToBottom = () => {
        if (chatEndRef.current != null) chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }

    return (
        <Wrapper>
            <ChannelList>
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
            </ChannelList>
            <Chatting>
                <ChattingWindow ref={chatEndRef}>
                    <Comment.Group>
                        {
                            chats.map((elem: ChatStruct) => {
                                if (elem.senderInfo.isMine) {
                                    return (
                                        <ChatWrapper>
                                            <MyComment>
                                                <MyComment.Content>
                                                    <Comment.Author>{elem.senderInfo.name}</Comment.Author>
                                                    <Comment.Text>{elem.data}</Comment.Text>
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
                                                    <Comment.Author>{elem.senderInfo.name}</Comment.Author>
                                                    <Comment.Text>{elem.data}</Comment.Text>
                                                </Comment.Content>
                                            </Comment>
                                        </ChatWrapper>
                                    )
                                }
                            })
                        }
                    </Comment.Group>
                </ChattingWindow>
                <InputArea>
                    <InputForm onChange={onMessageChange} value={message}/>
                    <SendButton onClick={() => sendMessage()}>전송</SendButton>
                </InputArea>
            </Chatting>
        </Wrapper>
    )
}

export default App;