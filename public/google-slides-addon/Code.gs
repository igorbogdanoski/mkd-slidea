function onOpen() {
  SlidesApp.getUi()
      .createAddonMenu()
      .addItem('Отвори MKD Slidea', 'showSidebar')
      .addToUi();
}

function onInstall() {
  onOpen();
}

function showSidebar() {
  var html = HtmlService.createHtmlOutputFromFile('Sidebar')
      .setTitle('MKD Slidea')
      .setWidth(300);
  SlidesApp.getUi().showSidebar(html);
}
