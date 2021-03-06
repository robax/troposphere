import React from 'react';
import Router from 'react-router';
import ProjectResourcesWrapper from './detail/resources/ProjectResourcesWrapper.react';
import InstanceDetailsView from './resources/instance/details/InstanceDetailsView.react';
import stores from 'stores';

export default React.createClass({
    displayName: "InstanceDetailsPage",

    mixins: [Router.State],

    render: function () {
      var project = stores.ProjectStore.get(Number(this.getParams().projectId)),
        instance = stores.InstanceStore.get(Number(this.getParams().instanceId)),
        helpLinks = stores.HelpLinkStore.getAll();

      if (!project || !instance || !helpLinks) {
        return <div className="loading"></div>;
      }

      return (
        <ProjectResourcesWrapper project={project}>
          <InstanceDetailsView project={project} instance={instance}/>
        </ProjectResourcesWrapper>
      );
    }

});
