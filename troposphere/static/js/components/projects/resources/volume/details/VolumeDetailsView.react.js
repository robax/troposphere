/** @jsx React.DOM */

define(
  [
    'react',
    'backbone',
    './sections/VolumeDetailsSection.react',
    './sections/VolumeInfoSection.react',
    'components/projects/common/BreadcrumbBar.react',
    './actions/VolumeActionsAndLinks.react',
    'stores/ProjectVolumeStore',
    'stores/ProviderStore',
    'stores/VolumeStore',
    'stores/IdentityStore',
    'controllers/NotificationController'
  ],
  function (React, Backbone, VolumeDetailsSection, VolumeInfoSection, BreadcrumbBar, VolumeActionsAndLinks, ProjectVolumeStore, ProviderStore, VolumeStore, IdentityStore, NotificationController) {

    function getState(project, volumeId) {
      return {
        volume: VolumeStore.get(volumeId),
        volumes: ProjectVolumeStore.getVolumesInProject(project),
        providers: ProviderStore.getAll()
      };
    }

    // var p1 = (
    //   <p>
    //     {
    //     "A volume is available when it is not attached to an instance. " +
    //     "Any newly created volume must be formatted and then mounted after " +
    //     "it has been attached before you will be able to use it."
    //     }
    //   </p>
    // );
    //
    // var links = [
    //   ["Creating a Volume", "https://pods.iplantcollaborative.org/wiki/x/UyWO"],
    //   ["Attaching a Volume to an Instance", "https://pods.iplantcollaborative.org/wiki/x/OKxm#AttachingaVolumetoanInstance-Attachingavolumetoaninstance"],
    //   ["Formatting a Volume", "https://pods.iplantcollaborative.org/wiki/x/OKxm#AttachingaVolumetoanInstance-Createthefilesystem%28onetimeeventpervolume%29"],
    //   ["Mounting a Volume", "https://pods.iplantcollaborative.org/wiki/x/OKxm#AttachingaVolumetoanInstance-Mountthefilesystemonthepartition"],
    //   ["Unmounting and Detaching Volume", "https://pods.iplantcollaborative.org/wiki/x/OKxm#AttachingaVolumetoanInstance-Detachingvolumesfrominstances"]
    // ];

    return React.createClass({

      propTypes: {
        volumeId: React.PropTypes.string.isRequired,
        project: React.PropTypes.instanceOf(Backbone.Model).isRequired
      },

      getInitialState: function(){
        return getState(this.props.project, this.props.volumeId);
      },

      componentDidMount: function () {
        ProjectVolumeStore.addChangeListener(this.updateState);
        ProviderStore.addChangeListener(this.updateState);
        VolumeStore.addChangeListener(this.updateState);

        // todo: IdentityStore is only included here because InstanceStore.get(instanceId) is
        // lazy loading, but I'm not sure how to get InstanceStore to know when new
        // identities have been without getting this component to call InstanceStore.getAll()
        // again at the moment.  Figure it out and remove this line.
        IdentityStore.addChangeListener(this.updateState);
      },

      componentWillUnmount: function () {
        ProjectVolumeStore.removeChangeListener(this.updateState);
        ProviderStore.removeChangeListener(this.updateState);
        VolumeStore.removeChangeListener(this.updateState);
        IdentityStore.removeChangeListener(this.updateState);
      },

      updateState: function(){
        if (this.isMounted()) this.setState(getState(this.props.project, this.props.volumeId));
      },

      render: function () {
        //<VolumeDetails volume={volume} providers={this.state.providers}/>
        if(this.state.volumes && this.state.providers && this.state.volume) {
          var volume = this.state.volumes.get(this.props.volumeId);
          if(!volume) NotificationController.error(null, "No volume with id: " + this.props.volumeId);
          volume = this.state.volume;

          return (
            <div>
              <BreadcrumbBar/>
              <div className="row resource-details-content">
                <div className="col-md-9 resource-detail-sections">
                  <VolumeInfoSection volume={volume}/>
                  <hr/>
                  <VolumeDetailsSection volume={volume} providers={this.state.providers}/>
                  <hr/>
                </div>
                <div className="col-md-3 resource-actions">
                  <VolumeActionsAndLinks volume={volume}/>
                </div>
              </div>
            </div>
          );
        }

        return (
           <div className="loading"></div>
        );
      }

    });

  });