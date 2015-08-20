define(function (require) {

  var AppDispatcher = require('dispatchers/AppDispatcher'),
      ImageVersionLicenseConstants = require('constants/ImageVersionLicenseConstants'),
      ImageVersionLicense = require('models/ImageVersionLicense'),
      Utils = require('./Utils'),
      stores = require('stores');

  return {

    add: function(params){
      if(!params.image_version) throw new Error("Missing image_version");
      if(!params.license) throw new Error("Missing license");

      var image_version = params.image_version,
          license = params.license,
          imageVersionLicense = new ImageVersionLicense(),
          data = {
            image_version: image_version.id,
            license: license.id
          };

      imageVersionLicense.save(null, {
        attrs: data
      }).done(function(){
        Utils.dispatch(ImageVersionLicenseConstants.ADD_IMAGEVERSION_LICENSE, {image_versionLicense: imageVersionLicense});
      }).fail(function(response){
        Utils.displayError({title: "License could not be added to ImageVersion", response: response});
      });
    },

    remove: function(params){
      if(!params.image_version) throw new Error("Missing image_version");
      if(!params.license) throw new Error("Missing license");

      var image_version = params.image_version,
          license = params.license,
          imageVersionLicense = stores.ImageVersionLicenseStore.findOne({
            'image_version.id': image_version.id,
            'license.id': license.id
          });

      imageVersionLicense.destroy().done(function(){
        Utils.dispatch(ImageVersionLicenseConstants.REMOVE_IMAGEVERSION_LICENSE, {image_versionLicense: imageVersionLicense});
      }).fail(function(response){
        Utils.displayError({title: "License could not be removed from ImageVersion", response: response});
      });
    }

  };

});