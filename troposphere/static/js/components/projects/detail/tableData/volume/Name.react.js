/** @jsx React.DOM */

define(
  [
    'react',
    'backbone',
    'url'
  ],
  function (React, Backbone, URL) {

    return React.createClass({

      propTypes: {
        project: React.PropTypes.instanceOf(Backbone.Model).isRequired,
        volume: React.PropTypes.instanceOf(Backbone.Model).isRequired
      },

      render: function () {
        var project = this.props.project,
            volume = this.props.volume;

        var volumeUrl = URL.projectVolume({
          project: project,
          volume: volume
        });

        return (
          <a href={volumeUrl}>{volume.get('name')}</a>
        );
      }

    });

  });
