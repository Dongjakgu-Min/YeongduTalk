import React from "react";
import {ChatStruct} from "../../../types/Message";
import {Comment} from "semantic-ui-react";
import styled from "styled-components";

const Image = styled.img`
    width: 30%;
`;

const Emoticon = styled.img`
    width: 130px;
    height: 130px;
`;

const ChatItem = (props: { elem: ChatStruct, downloadFile: Function }) => {
    const { elem, downloadFile } = props;

    return (
        <div>
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
        </div>
    )
}

export default ChatItem;