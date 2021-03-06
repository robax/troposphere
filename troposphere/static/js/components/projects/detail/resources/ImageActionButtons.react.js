import React from 'react';
import Backbone from 'backbone';
import Button from './Button.react';
import actions from 'actions';
import modals from 'modals';


export default React.createClass({
    displayName: "ImageActionButtons",

    propTypes: {
      multipleSelected: React.PropTypes.bool.isRequired,
      image: React.PropTypes.instanceOf(Backbone.Model).isRequired,
      project: React.PropTypes.instanceOf(Backbone.Model).isRequired
    },

    onDelete: function () {
      this.props.onUnselect(this.props.image);
      modals.ProjectModals.removeResources(
        new Backbone.Collection([this.props.image]),
        this.props.project
      );
    },

    render: function () {
      var image = this.props.image,
        linksArray = [];
      linksArray.push(
        <Button
          key="Delete"
          icon="remove"
          tooltip="Delete"
          onClick={this.onDelete}
          isVisible={true}
          />
      );

      return (
        <div className="clearfix u-md-pull-right">
          {linksArray}
        </div>
      );
    }
});
