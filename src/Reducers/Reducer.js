// APP
import * as Actions from "../Actions/Actions.js";

function Reducer(state, action) {
  switch(action.type) {
    case Actions.UPDATE_FOCUSED:
      return action.exec(state);
    case Actions.UPDATE_ROOT:
      return action.exec(state);
    case Actions.ADD_BULLET:
      return action.exec(state);
    case Actions.ADD_SUB_BULLET:
      return action.exec(state);
    case Actions.EDIT_BULLET:
      return action.exec(state);
    case Actions.DELETE_BULLET:
      return action.exec(state);
    case Actions.INDENT_BULLET:
      return action.exec(state);
    case Actions.UNINDENT_BULLET:
      return action.exec(state);
    case Actions.MOVE_BULLET:
      return action.exec(state);
    case Actions.GO_UP:
      return action.exec(state);
    case Actions.GO_DOWN:
      return action.exec(state);
    case Actions.EDIT_BULLET_NOTE:
      return action.exec(state);
    case Actions.TOGGLE_COLLAPSE:
      return action.exec(state);
    case Actions.TOGGLE_BULLET_COMPLETION:
      return action.exec(state);
    default:
      return state;
  }
};

export default Reducer;
