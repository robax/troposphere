import React from 'react/addons';
import Backbone from 'backbone';
import _ from 'underscore';
import modals from 'modals';
import stores from 'stores';
import actions from 'actions';
import BootstrapModalMixin from 'components/mixins/BootstrapModalMixin.react';

import ImageSelectStep from './launch/steps/ImageSelectStep.react';
import ProjectCreateView from 'components/common/ProjectCreateView.react';
import BasicLaunchStep from './launch/steps/BasicLaunchStep.react';
import AdvancedLaunchStep from './launch/steps/AdvancedLaunchStep.react';

// This class implements the instance launch walkthrough. By design it keeps
// track of two states. First is the state for switching between separate
// views of the modal. The second is the state for launching an actual
// instance, i.e. the state requisite for the launch api call (see
// onSubmitLaunch). Do not add state friviously. This component operates by
// defining all the operations to update its state as functions which it
// passes to the appropriate children.
export default React.createClass({
    mixins: [BootstrapModalMixin],
    displayName: "InstanceLaunchWizardModal",

    propTypes: {
        image: React.PropTypes.instanceOf(Backbone.Model),
        project: React.PropTypes.instanceOf(Backbone.Model),
        onConfirm: React.PropTypes.func.isRequired,
        initialView: React.PropTypes.string.isRequired,
    },

    getInitialState: function() {

        // We might have these
        let image = this.props.image ? this.props.image : null;
        let instanceName = image ? image.get("name") : null;
        let projectList = stores.ProjectStore.getAll();
        let project = this.props.project ? this.props.project : null;
        let view = this.props.initialView;

        // Check if the user has any projects, if not then set view to "PROJECT_VIEW"
        // to create a new one
        if (view != "IMAGE_VIEW" && projectList.length === 0) {
            view = "PROJECT_VIEW";
        }

        return {
            // State for general operation (switching views, etc) 
            view,
            image,
            provider: null,
            showValidationErr: false,

            // State for launch
            instanceName,
            imageVersion: null,
            project,
            providerSize: null,
            identityProvider: null,
            attachedScripts: [],
        }
    },

    // Set the component's state based on cloud defaults. 
    //
    // Whenever the wizard mounts it listens for changes from the stores,
    // passing this function as a callback. Incrementally it calls stores to
    // fetch data. It only sets state for defaults, i.e. if project is null,
    // set the project to the first returned from the cloud. It primes our
    // stores, so that render can just call get and eventually get data.
    updateState: function() {
        var project = this.state.project;
        if (!project) {
            project = stores.ProjectStore.getAll().first();
        }

        var imageVersionList;
        if (this.state.image) {
            imageVersionList = stores.ImageVersionStore.fetchWhere({image_id: this.state.image.id});
        }

        var imageVersion = this.state.imageVersion;
        if (imageVersionList && !imageVersion) {
            imageVersion = imageVersionList.last();
        }

        var providerList, provider;
        if (imageVersion) {
            providerList = new Backbone.Collection(imageVersion.get('machines').map((item) => item.provider));
            provider = this.state.provider ?
                this.state.provider :
                providerList.first();
        }

        var resourcesUsed, identityProvider, providerSizeList, providerSize;
        if (provider) {
            resourcesUsed = stores.InstanceStore.getTotalResources(provider.id);

            identityProvider = stores.IdentityStore.findOne({ 'provider.id': provider.id });

            providerSizeList = stores.SizeStore.fetchWhere({
                provider__id: provider.id
            });

            if (providerSizeList) {
                providerSize = this.state.providerSize ?
                    this.state.providerSize :
                    providerSizeList.first();
            };
        }

        // NOTE: Only update state for things that need defaults. Data fetched
        // from the cloud is not part of the component's state that it
        // manages.
        this.setState({
            imageVersion,
            project,
            provider,
            providerSize,
            identityProvider,
        });
    },

    componentDidMount: function() {
        stores.IdentityStore.addChangeListener(this.updateState);
        stores.ProviderStore.addChangeListener(this.updateState);
        stores.SizeStore.addChangeListener(this.updateState);
        stores.ProjectStore.addChangeListener(this.updateState);
        stores.ImageVersionStore.addChangeListener(this.updateState);
        stores.ScriptStore.addChangeListener(this.updateState);

        // NOTE: This is not nice. This enforces that every time a component
        // mounts updateState gets called. Otherwise, if a component mounts
        // after data has been fetched, then updateState never gets called. 
        this.updateState();
    },

    componentWillUnmount: function() {
        stores.IdentityStore.removeChangeListener(this.updateState);
        stores.ProviderStore.removeChangeListener(this.updateState);
        stores.SizeStore.removeChangeListener(this.updateState);
        stores.ProjectStore.removeChangeListener(this.updateState);
        stores.ImageVersionStore.removeChangeListener(this.updateState);
        stores.ScriptStore.removeChangeListener(this.updateState);
    },

    viewImageSelect: function() {
        this.setState({ view: "IMAGE_VIEW", });
    },

    viewBasic: function() {
        this.setState({ view: 'BASIC_VIEW', });
    },

    viewAdvanced: function() {
        this.setState({ view:'ADVANCED_VIEW', });
    },

    onSelectImage: function(image) {
        let instanceName = image.get('name');
        var imageVersion, providerSize, identityProvider;

        let imageVersionList = stores.ImageVersionStore.fetchWhere({image_id: image.id});
        if (imageVersionList) {
            imageVersion = imageVersionList.last();
        }

        let providerSizeList;
        if (imageVersion) {
            let providerList = new Backbone.Collection(imageVersion.get('machines').map((item) => item.provider));
            let provider = providerList.first();
            providerSizeList = stores.SizeStore.fetchWhere({
                provider__id: provider.id
            });

            identityProvider = stores.IdentityStore.findOne({
                'provider.id': provider.id
            });
        }

        if (providerSizeList) {
            providerSize = providerSizeList.first();
        };

        this.setState({
            image,
            instanceName,
            imageVersion,
            providerSize,
            providerSize,
            identityProvider,
        }, this.viewBasic);
    },

    onProjectCreateConfirm: function(name, description) {
        this.viewBasic();
        actions.ProjectActions.create({
            name: name,
            description
        });
    },

    onBack: function() {
        this.viewImageSelect();
    },

    onNameChange: function(e) {
        this.setState({ instanceName: e.target.value });
    },

    onNameBlur: function(e) {
        let instanceName = this.state.instanceName.trim();
        this.setState({instanceName});
    },

    onVersionChange: function(imageVersion) {
        let providerList = new Backbone.Collection(imageVersion.get('machines').map((item) => item.provider));
        let provider = providerList.first();
        providerSizeList = stores.SizeStore.fetchWhere({
            provider__id: provider.id
        });

        identityProvider = stores.IdentityStore.findOne({
            'provider.id': provider.id
        });

        if (providerSizeList) {
            providerSize = providerSizeList.first();
        };

        this.setState({
            imageVersion,
            provider,
            providerSize,
            identityProvider
        });
    },

    onProjectChange: function(project) {
        this.setState({ project });
    },

    onProviderChange: function(provider) {
        let providerSizeList = stores.SizeStore.fetchWhere({
            provider__id: provider.id
        });

        let providerSize;

        let identityProvider = stores.IdentityStore.findOne({
            'provider.id': provider.id
        });

        if (providerSizeList) {
            providerSize = providerSizeList.first();
        };

        this.setState({
            provider,
            providerSize,
            identityProvider
        });
    },

    onSizeChange: function(providerSize) {
        this.setState({ providerSize });
    },

    onRequestResources: function() {
        this.hide();
        modals.HelpModals.requestMoreResources(this);
    },

    onAddAttachedScript: function(value) {
        let attachedScripts = this.state.attachedScripts;

        this.setState({ attachedScripts: [...attachedScripts, value] });
    },

    onRemoveAttachedScript: function(item) {
        let attachedScripts = this.state.attachedScripts
            .filter((i) => i != item);

        this.setState({ attachedScripts });
    },

    onSaveAdvanced: function() {
        this.viewBasic()
    },

    onCancelAdvanced: function() {
        this.setState({ attachedScripts: [] });
        this.viewBasic();
    },

    // This is a callback that returns true if the provider size in addition to resources already using
    // will exceed the user's allotted resources.
    exceedsResources: function() {
        let provider = this.state.provider;
        let identityProvider = this.state.identityProvider;
        let size = this.state.providerSize;

        if ( identityProvider && size && provider) {
            let resourcesUsed = stores.InstanceStore.getTotalResources(provider.id);

            // Calculate and set all of our graph information
            // AU's Used
            let  allocationConsumed = identityProvider.get('usage').current;
            let  allocationTotal = identityProvider.get('usage').threshold;

            // CPU's have used + will use
            let  allocationCpu = identityProvider.get('quota').cpu;
            let  cpuWillTotal = resourcesUsed.cpu + size.get('cpu');

            // Memory have used + will use
            let  allocationMem = identityProvider.get('quota').memory;
            let  memUsed = resourcesUsed.mem / 1000;
            let  memWillUse = size.get('mem');
            let  memWillTotal = memUsed + size.get('mem');
            if (allocationConsumed >= allocationTotal) {
                return true;
            }
            if (cpuWillTotal >= allocationCpu) {
                return true;
            }
            if (memWillTotal >= allocationMem) {
                return true;
            }
            return false
        }
        return true;
    },

    canLaunch: function() {
        let requiredFields = ["project", "identityProvider", "providerSize", "imageVersion", "attachedScripts"];
        let notFalsy = ((prop) => Boolean(this.state[prop]) != false);

        // instanceName will be null, indicating that it has not been set.
        // If instanceName equals the empty string, the user has erased the
        // name, and is trying to launch an instance with no name.
        if ( _.every(requiredFields, notFalsy)) {
            if (this.state.instanceName == "") { return false };
            if (this.exceedsResources()) { return false };
            return true;
        }
        return false
    },

    onSubmitLaunch: function() {
        if (this.canLaunch()) {
            debugger;
            let launchData = {
                project: this.state.project,
                instanceName: this.state.instanceName.trim(),
                identity: this.state.identityProvider,
                size: this.state.providerSize,
                version: this.state.imageVersion,
                scripts: this.state.attachedScripts
            };

            actions.InstanceActions.launch(launchData);
            this.hide();
            return
        }

        this.setState({showValidationErr: true})
    },

    renderImageSelect: function() {

        return (
            <ImageSelectStep
                image={this.state.image}
                onSelectImage={this.onSelectImage}
                onCancel = {this.hide}
            />
        );
    },

    renderProjectCreateStep: function() {
        return (
            <ProjectCreateView
                cancel={this.hide}
                onConfirm={this.onProjectCreateConfirm}
            />
        );
    },

    renderBasicOptions: function() {
        let provider = this.state.provider;
        let providerSize = this.state.providerSize;
        let image = this.state.image;
        let imageVersion = this.state.imageVersion;
        let projectList = stores.ProjectStore.getAll() || null;
        let identities = stores.IdentityStore.getAll() || null;

        var project = this.state.project;
        if (!project && projectList) {
            project = projectList.first();
        }

        var imageVersionList;
        if (this.state.image) {
            imageVersionList = stores.ImageVersionStore.fetchWhere({image_id: this.state.image.id});
        }

        var providerList, providerSizeList, resourcesUsed; 
        if (provider && imageVersion) {
            providerList = new Backbone.Collection(imageVersion.get('machines').map((item) => item.provider));
            providerSizeList = stores.SizeStore.fetchWhere({
                provider__id: provider.id
            });
            resourcesUsed = stores.InstanceStore.getTotalResources(provider.id);
        }

        return (
            <BasicLaunchStep { ...{
                    showValidationErr: this.state.showValidationErr,
                    attachedScripts: this.state.attachedScripts,
                    backIsDisabled: this.props.initialView == "BASIC_VIEW",
                    launchIsDisabled: !this.canLaunch(),
                    identityProvider: this.state.identityProvider,
                    image,
                    imageVersion,
                    imageVersionList,
                    instanceName: this.state.instanceName,
                    onBack: this.onBack,
                    onCancel: this.hide,
                    onNameChange: this.onNameChange,
                    onNameBlur: this.onNameBlur,
                    onProjectChange: this.onProjectChange,
                    onProviderChange: this.onProviderChange,
                    onRequestResources: this.onRequestResources,
                    onSizeChange: this.onSizeChange,
                    onSubmitLaunch: this.onSubmitLaunch,
                    onVersionChange: this.onVersionChange,
                    project,
                    projectList,
                    provider,
                    providerList,
                    providerSize,
                    providerSizeList,
                    resourcesUsed,
                    viewAdvanced: this.viewAdvanced,
                }}
            />
        )
    },

    renderAdvancedOptions: function() {
        let bootScriptList = stores.ScriptStore.getAll();
        return (
            <AdvancedLaunchStep
                bootScriptList={bootScriptList}
                attachedScripts={this.state.attachedScripts}
                onAddAttachedScript={this.onAddAttachedScript}
                onRemoveAttachedScript={this.onRemoveAttachedScript}
                cancelAdvanced={this.onCancelAdvanced}
                onSaveAdvanced={this.onSaveAdvanced}
            />
        );
    },
    
    renderBody: function() {
        var view = this.state.view;
        switch(view) {
            case "IMAGE_VIEW":
            return this.renderImageSelect()
            case "PROJECT_VIEW":
            return this.renderProjectCreateStep()
            case "BASIC_VIEW":
            return this.renderBasicOptions()
            case "ADVANCED_VIEW":
            return this.renderAdvancedOptions()
        }
    },

    headerTitle: function() {
        var view = this.state.view;
        switch(view) {
            case "IMAGE_VIEW":
            return "Select an Image"
            case "PROJECT_VIEW":
            return "Create New PRoject"
            case "BASIC_VIEW":
            return "Basic Options"
            case "ADVANCED_VIEW":
            return "Advanced Options"
        }
    },

    render: function() {

        return (
            <div className="modal fade">
                <div className="modal-dialog" style={{width:"100%", maxWidth:"800px"}}>
                    <div className="modal-content">
                        <div className="modal-header instance-launch">
                            {this.renderCloseButton()}
                            <h2 className="headline">Launch an Instance / {this.headerTitle()}</h2>
                        </div>
                        <div className="modal-body">
                            {this.renderBody()}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
});
