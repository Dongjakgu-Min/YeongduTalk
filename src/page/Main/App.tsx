import React, { useState, useEffect } from 'react';
import {NormalChannelInfo} from "node-kakao";
import {Comment, List} from 'semantic-ui-react';
import styled from "styled-components";
import {Long} from "bson";
import {useLocation} from "react-router-dom";
import {ChannelInfo} from "../../types/Channel";

import { ChatStruct, ChannelStruct } from '../../types/Message';
import {getChatList} from "../../action/Room";

const ChannelList = styled.div`
    width: 40%;
`;

const Chatting = styled.div`
    width: 60%;
`;

const Wrapper = styled.div`
  width: 100%;
  display: flex;
`;

const MyComment = styled(Comment)`
  text-align: right;
`;

const ChatWrapper = styled.div`
    width: 100%;
`;

const electron = window.require('electron');
const { ipcRenderer } = electron;

function App () {
    const [users, setUsers] = useState<ChannelStruct[]>([]);
    const [profile, setProfile] = useState<Long>();
    const [chats, setChats] = useState<ChatStruct[]>([]);
    const [channel, setChannel] = useState<Long>();
    const location = useLocation<Record<string, unknown>>();
    const { userId } = location.state;

    useEffect(() => {
        ipcRenderer.send('ChannelList');
        ipcRenderer.send('GetMyProfile');
    }, []);

    useEffect(() => {}, [chats]);

    useEffect(() => {
        ipcRenderer.send('GetChatList', { channelId: channel });
    }, [channel]);

    ipcRenderer.removeAllListeners('NewChat');
    ipcRenderer.removeAllListeners('GetMyProfile');
    ipcRenderer.removeAllListeners('GetChatList');

    ipcRenderer.on('ChannelResponse', (event, argument) => {
        setUsers(argument);
    });

    ipcRenderer.on('NewChat', (event, argument: ChatStruct) => {
        if (argument.channelId === channel) {
            setChats([...chats, argument]);
        }
    });

    ipcRenderer.on('GetChatListResult', (event, argument: ChatStruct[]) => {
        setChats(argument);
    });

    ipcRenderer.on('GetMyProfile', (event, argument) => {
        setProfile(argument);
    });

    return (
        <Wrapper>
            <ChannelList>
                <List divided relaxed>
                    {
                        users.map((elem: ChannelStruct) => {
                            return (
                                <List.Item onClick={() => setChannel(elem.info.channelId)}>
                                    <List.Header>{elem.name}</List.Header>
                                </List.Item>
                            )
                        })
                    }
                </List>
            </ChannelList>
            <Chatting>
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
                                            <Comment.Avatar src={elem.senderInfo.profileURL} />
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
            </Chatting>
        </Wrapper>
    )
}

export default App;