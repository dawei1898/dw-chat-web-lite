import React from 'react';
import {Typography} from "antd";
import hljs from 'highlight.js'; // 高亮
import 'highlight.js/styles/atom-one-light.css'; // 高亮样式

type Props = {
    content: string
}

/**
 * 使用 Markdown 格式渲染 文本
 */
const MarkdownRender = (props: Props) => {
    const md = new (require('markdown-it'))({
        html: true,
        breaks: true,
        highlight: function (str: string, lang: string) {
            if (lang && hljs.getLanguage(lang)) {
                try {
                    return `<pre class="hljs"><code>${
                        hljs.highlight(str, {
                            language: lang,
                            ignoreIllegals: true
                        }).value
                    }</code></pre>`;
                } catch (__) {
                }
            }
            return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`;
        }
    });

    return (
        <>
            <Typography>
                <div
                    className="markdown-body"
                    dangerouslySetInnerHTML={{__html: md.render(props.content)}}
                />
            </Typography>
        </>
    );
};

export default MarkdownRender;


