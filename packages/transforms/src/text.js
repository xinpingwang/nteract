/* @flow */
import React from "react";
// $FlowFixMe
import Ansi from "ansi-to-react";

type Props = {
  data: string,
  mediaType: "text/plain"
};

export default class TextDisplay extends React.Component<Props, null> {
  static MIMETYPE = "text/plain";

  shouldComponentUpdate(nextProps: Props) {
    // Calculate shouldComponentUpdate because we don't use metadata or models
    // on the plaintext transform
    return nextProps.data !== this.props.data;
  }
  static defaultProps = {
    data: "",
    mediaType: "text/plain"
  };

  render(): ?React$Element<any> {
    return (
      <pre>
        <Ansi linkify={false}>{this.props.data}</Ansi>
      </pre>
    );
  }
}
