// VENDOR
import React, { Component } from "react";
import { createStore } from "redux";
import ComponentManager from "sn-components-api";
import yaml from "yaml-js";

// APP
import "./App.css";
import * as Actions from "../Actions/Actions.js";
import Navbar from "../Components/Navbar/Navbar.js";
import Header from "../Components/Header/Header.js";
import Body from "../Components/Body/Body.js";
import Reducer from "../Reducers/Reducer.js";

class App extends Component {

  constructor(props) {
    super(props);
    this.key = 1; // allows the editor to quickly reload the first bullet with data from a pre-exisiting note that isn't in bullet format such as a letter or note to self
    this.root = Actions.createRoot(); // the root bullet (isn't seen by user) is a javascript object that contains the initial bullet or any data for the app
    let root = this.root;
    this.state = { root, mobile: (window.innerWidth < 500) };
    this.initializeStore(); // the editor uses a redux store that holds the app data. it updates the apps ui via its component state as well as the note via componentmanager

  }

  initializeStore() {
    this.store = createStore(Reducer, this.state);
  }

  initializeStoreCallback() {
    if (this.unsubscribe) { // if the note is being changed to another, unsubscribe from the previous app redux store
      this.unsubscribe();
    }
    this.unsubscribe = this.store.subscribe(() => { // if the redux store has been updated, update the app state/ui along with the standardnotes note via componentmanager
      this.setState(this.store.getState());
      if (this.note) {
        let note = this.note;
        let noteContent = yaml.dump(this.state.root); // the bullet data is stored in yaml format, this can be seen if the user switches to plain editor view
        this.componentManager.saveItemWithPresave(note, () => {
          note.content.text = noteContent;
          note.content.preview_plain = "---";
          note.content.preview_html = null;
        });
      }
    });
  }

  initializeTree(item) {
    this.note = item;
    let noteContent;
    try {
      noteContent = yaml.load(item.content.text); // notes that begin with characters such as "," will throw error
    }
    catch {
      noteContent = item.content.text;
    }
    switch (typeof noteContent) {
      case "string": // is the user's note not in bullet format? no problem! just add the text to the first bullet
        this.store.dispatch(Actions.editBullet([this.state.root.id, this.state.root.children[0].id], noteContent));
        this.key += 1;
        this.forceUpdate();
        break;
      case null: // if the user's note is empty, just use the dummy bullets created in the constructor
        this.store.dispatch(Actions.updateRoot(this.state.root));
        break;
      case "object":
        if (Actions.isCorrectFormat(noteContent)) { // if the user's note is in proper bullet format, load the bullets into the editor
          this.store.dispatch(Actions.updateRoot(noteContent));
        }
        else { // if not, load the user's note data as a string into the first bullet
          this.store.dispatch(Actions.editBullet([this.state.root.id, this.state.root.children[0].id], JSON.stringify(noteContent)));
        }
        break;
      default:
        break;
    }
  }

  noteChange(item) {
    if (!this.note) { // is the editor being opened for the first time?
      this.initializeTree(item);
      return;
    }
    else if (this.note.uuid !== item.uuid) { // has the user changed to another note?
      this.initializeStore();
      this.initializeStoreCallback();
      this.initializeTree(item);
      return;
    }
    else { // update note property
      this.note = item;
      return;
    }
  }

  componentDidMount() {
    let permissions = [{ name: "stream-context-item" }];
    this.componentManager = new ComponentManager(permissions, () => {}); // initialize componentmanager
    this.componentManager.streamContextItem(this.noteChange.bind(this));
    this.initializeStoreCallback();
  }

  render() {
    const { root } = this.state;
    const { focused } = this.state.root;
    const focusedBullet = Actions.getNode(focused.slice(), root); // the terms focused, focusedBullet, and focused Tree relate to how zoomed in the user is into the bullet tree,
    const focusedTree = Actions.getTree(focused.slice(), root); // a zoom/focus happens when the user clicks on any bullet icon
    return (
      <div key={ this.key } id="bullet-editor" className={ "app p-4 w-100 h-100" }>
        <Navbar store={ this.store } focusedTree={ focusedTree } focused={ focused }></Navbar>
        { focused.length > 1 &&
        <Header focusedBullet={ focusedBullet } address={ focused } store={ this.store } key={ "header-" + focusedBullet.id }></Header>
        }
        <Body focusedBullet={ focusedBullet } focused={ focused } store={ this.store }></Body>
      </div>
    );
  }
}

export default App;
