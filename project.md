Im trying to create a free opensource High Quality OSINT tool that anyone can use to map out information about a target. 
It will contain a whole bunch of ways you can map out the information you find about someone. 
One of the main core features is the ability to map out pin point on a map for the targets visited locations.

Project Guidelines:

I want it to be web based tool that uses NPM so that way its accessable to any operating system. If that is needed please use that.
I want HTML,CSS and Javascript to be used, but its not limited to these options.

How it will work:
The user will first create a target that they want to map out and research. It will be done similar to creating a new project in any program now a days.

Then there will be a bunch of identifying options you can chose to help map out who they are reasearching. For example, an option for Instagram. The user locates
a profile for the target and enters their details on there. LIke thier IG username, email if possible, followers, following count, images posted, videos posted, amount of pictures tagged in.
There will also be an option for phone numbers. there will be an option for emails, family members, VINs, license plate numbers, cars, etc.

If needed once we get the foundations set, we can make a way for the Osint tool to try to access the IG page to get the details. If its private, we can implement a way later to
get that information, which would probably involve getting the users IG credentials.

There will be options for all types of social media like facebook, youtube, Tik-Tok, Linked In, etc. There will even be an option to add a custom identifer for any other social media.

Then we have a separate tab for mapping out the targets known locations. It will use Google Maps with a API key provided by the user. I also want an offline map if possible. But we will first impliment the Gogole maps option. I want the user to be able to create pins on the map
on where the target has visited. When a new Pin is created it will try to use that location and get the information from google about that place. For example, if they visted a coffee shop and the user presses on that coffee shop, it will show all of the coffee shops information. There also needs to be a way for
the user no matter what, to add custom details in there. LIke a time of visit, who they were with, or anthing else that they want. If a place cannot be found, for that picked location, the user can enter information about that pin

The user must be able to save these projects and import existing projects.

Layout/Design:

I want it to look very nice and modern and sleek with a comfortable dark design. The user can also select a light theme as well.

Once the tool is opened. I want there to be a sleek modern look with a button that says new project and one that says open project.

At the top of the page, there will be two tabs once a project is opened or created. There will be tab on the left for adding and listing information like social media, numbers, names, emails, etc.
The left tab page will contain a full vertical section on the left side that takes up 20% of the page, and it will contain all of the individual identifying information that was used in a vertical list.
The rest of the page on the right side will have a node base system that the user can use to make connections to other sources of information if needeed.

The right tab is the map section. In this page, it will contain a full vertical section on the left side that takes up 20% of the page, and it will contain all of the listed/pinned locations.
The rest of the page will be the map.

