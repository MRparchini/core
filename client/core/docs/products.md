# products service
---
the columns of the producs worksheet must be: 
ID
Name
KitchenName
Category
IsActive
Description
CreatedAt
UpdatedAt

I want to creat product CRUD servise in backend and its pages in my frontend application.
it must has paggination and searching in name column and kitchenName column.
for technical reference you can look costumer service files in both applications.
also you must edit config.js in backend application because its created based on single servise which was costumer but it must be the config of all applications servises.
 
separated costumer configs for its servises and creat a new config file for every new servises we add later but creat a general global config for storing shared DATA like SPREADSHEET_ID.
remember you have to refactor costumer files based on this changes too.
frontend application path: ./client/core
backend application path: ./server/appScripts