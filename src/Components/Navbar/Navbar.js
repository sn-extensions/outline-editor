// VENDOR
import React, { Component } from "react";

// APP
import "./Navbar.css";
import * as Actions from "../../Actions/Actions.js";
import { ELLIPSE } from "../../Constants/Constants.js";

class Navbar extends Component {

  navigateTo(index) {
    return () => {
      this.props.store.dispatch(Actions.updateFocused(this.props.focused.slice(0, index+1))); // focuses back to any of the parent bullets
    }
  }

  navigateHome() {
    this.props.store.dispatch(Actions.updateFocused([this.props.focused[0]])); // focuses back to the root bullet and its root children (completely zoomed out)
  }

  truncate(str, length=30) {
    if (str.length <= length) {
      return str.replace(/(<)(b|i|u|(strike))(>)/gi, "").replace(/(<)(\/)(b|i|u|(strike))(>)/gi, "")
    }
    else {
      return str.replace(/(<)(b|i|u|(strike))(>)/gi, "").replace(/(<)(\/)(b|i|u|(strike))(>)/gi, "").substring(0, length - ELLIPSE.length) + ELLIPSE;
    }
  }

  render() {
    // the 🏠 p tag would be the equivalent to the root bullet
    // the focus tree map starts at 1 because bullet 0 is the root bullet which isn't seen by the user
    // the navigateTo p tags allow the user to zoom out to any of the parent bullets in the focus tree
    return (
      <div className="nav d-flex flex-row m-0 mx-n4 mb-4 p-2 px-4">
        <p className="pr-2 pt-2" onClick={ this.navigateHome.bind(this) }><i className="fas fa-home"></i></p>
      { this.props.focusedTree.length > 1 &&
        this.props.focusedTree.slice(1, this.props.focusedTree.length).map((node, index) =>
        <p key={ index }
           className="nav-link px-2"
           onClick={ this.navigateTo((index + 1)).bind(this) }
           dangerouslySetInnerHTML={{ __html: (" > " + this.truncate(node.content)) }}>
        </p>
      )}
      </div>
    )
  }

}

export default Navbar;
