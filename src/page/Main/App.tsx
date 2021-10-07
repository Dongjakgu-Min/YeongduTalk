import React, { useState, useEffect } from 'react';
import {NormalChannelInfo} from "node-kakao";
import {Comment, List} from 'semantic-ui-react';
import styled from "styled-components";
import {Long} from "bson";
import {useLocation} from "react-router-dom";

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

type Channel = {
    name: string,
    info: NormalChannelInfo
};

type Chat = {
    id: Long,
    senderInfo: {
        senderId: Long,
        name: string,
        profileURL: string,
    }
    data: string
}

function App () {
    const [users, setUsers] = useState<Channel[]>([]);
    const [profile, setProfile] = useState<Long>();
    const [chats, setChats] = useState<Chat[]>([]);
    const [channel, setChannel] = useState<Long>();
    const location = useLocation<Record<string, unknown>>();
    const { userId } = location.state;

    useEffect(() => {
        ipcRenderer.send('ChannelList');
        ipcRenderer.send('GetMyProfile');
    }, []);

    useEffect(() => {}, [chats]);

    ipcRenderer.removeAllListeners('NewChat');
    ipcRenderer.removeAllListeners('GetMyProfile');

    ipcRenderer.on('ChannelResponse', (event, argument) => {
        setUsers(argument);
    });

    ipcRenderer.on('NewChat', (event, argument) => {
        setChats([...chats, argument]);
    });

    ipcRenderer.on('GetMyProfile', (event, argument) => {
        setProfile(argument);
    });

    const onClick = () => {
        ipcRenderer.send('FriendList');
    }

    const getChannel = () => {
        ipcRenderer.send('ChannelList');
    }

    return (
        <Wrapper>
            <ChannelList>
                <List divided relaxed>
                    {
                        users.map((elem: Channel) => {
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
                        chats.map((elem: Chat) => {
                            if (elem.senderInfo.senderId === profile) {
                                return (
                                    <ChatWrapper>
                                        <MyComment>
                                            <Comment.Content>
                                                <Comment.Author>{elem.senderInfo.name}</Comment.Author>
                                                <Comment.Text>{elem.data}</Comment.Text>
                                            </Comment.Content>
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