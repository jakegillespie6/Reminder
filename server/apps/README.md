/apps folder is an entity layer approach to dividing up the codebase into owned domains. /calendar_events will own calendar event logic, /auth will own authentication logic, and so on.

The architecture for an app is as follows:
- /services or services.py: Logic layer and exception raising.
- /views or views.py: Endpoint layer. Views are responsible for reading in parameters or request data and validating a request with the appropriate serializer class. The serialized data (if any) should be passed on to the service function within the view to return back data to once again be serialized. Views are also responsible for authorization. A viewset can determine authorization at the endpoint level or at the entire viewset level.
- /urls or urls.py: generic exposure of Viewsets to be imported into the core application. 
- /serializers or serializers.py: These define the shapes of data coming in and data going out. Additionally these can be used for dynamic properties like and functions. However, things like "save" should not be delegated by serializer, this should be handled in a logic function.
- /models or models.py: Defines the database schema. Additionally this file will contain query set maangers.

Additional structural notes:
- To keep apps maintainable and self contained, if needed, a base.py file should be made to contain all domain logic. And anything that involves dependency on other apps should become its own file and be named to appropriately indicate what the file is intended for.
- The intent of this is to avoid circular dependencies and keep files predictable.
- This base.py structure can happen for any layer (views, urls, services, serializers, etc.)
    For example:
        /calendar_events
            /services
                - base.py: contains specifically calendar_event domain logic
                - some_other_file.py: contains logic specific to the other domain

            