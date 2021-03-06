// -------------------------------------------------------------------------
//                     The CodeChecker Infrastructure
//   This file is distributed under the University of Illinois Open Source
//   License. See LICENSE.TXT for details.
// -------------------------------------------------------------------------

define([
  'dojo/_base/declare',
  'dojo/topic',
  'dojo/dom-construct',
  'dijit/Dialog',
  'dijit/form/Button',
  'dijit/layout/BorderContainer',
  'dijit/layout/ContentPane',
  'dijit/layout/TabContainer',
  'codechecker/CheckerStatistics',
  'codechecker/hashHelper',
  'codechecker/HeaderMenu',
  'codechecker/ListOfBugs',
  'codechecker/ListOfRuns',
  'codechecker/util'],
function (declare, topic, domConstruct, Dialog, Button,
  BorderContainer, ContentPane, TabContainer, CheckerStatistics, hashHelper,
  HeaderMenu, ListOfBugs, ListOfRuns, util) {

  var runDataList = null;

  function findRunData(runName) {
    return util.findInArray(runDataList, function (runData) {
      return runData.name === runName;
    });
  }

  function initByUrl() {
    var state = hashHelper.getValues();

    for (var key in state)
      if (key.indexOf('userguide-') !== -1) {
        topic.publish('tab/userguide');
        return;
      }

    switch (state.tab) {
      case undefined:
        if (state.run || state.baseline || state.newcheck || state.difftype ||
          state.reportHash || state.report)
          topic.publish('tab/allReports');
        else
          topic.publish('tab/listOfRuns');
        return;
      case 'statistics':
        topic.publish('tab/checkerStatistics');
        return;
      case 'userguide':
        topic.publish('tab/userguide');
        return;
      case 'allReports':
        topic.publish('tab/allReports');
        return;
    }

    var runs = state.tab.split('_diff_');
    if (runs.length == 2) {
      topic.publish('openDiff', {
        tabData  : { baseline : findRunData(runs[0]),
                     newcheck : findRunData(runs[1]) },
        baseline : findRunData(state.baseline),
        newcheck : findRunData(state.newcheck),
        difftype : state.difftype ? state.difftype : CC_OBJECTS.DiffType.NEW
      });
    } else {
      topic.publish('openRun', {
        tabData : findRunData(runs[0]),
        runData : findRunData(state.run)
      });
    }
  }

  return function () {

    //---------------------------- Global objects ----------------------------//

    CC_SERVICE = new codeCheckerDBAccess_v6.codeCheckerDBAccessClient(
      new Thrift.Protocol(new Thrift.Transport(
        "v" + CC_API_VERSION + "/CodeCheckerService")));

    CC_OBJECTS = codeCheckerDBAccess_v6;

    CC_AUTH_SERVICE =
      new codeCheckerAuthentication_v6.codeCheckerAuthenticationClient(
        new Thrift.TJSONProtocol(
          new Thrift.Transport("/v" + CC_API_VERSION + "/Authentication")));

    CC_AUTH_OBJECTS = codeCheckerAuthentication_v6;

    CC_PROD_SERVICE =
      new codeCheckerProductManagement_v6.codeCheckerProductServiceClient(
        new Thrift.Protocol(new Thrift.Transport(
          "v" + CC_API_VERSION + "/Products")));

    CC_PROD_OBJECTS = codeCheckerProductManagement_v6;

    //----------------------------- Main layout ------------------------------//

    var layout = new BorderContainer({ id : 'mainLayout' });

    var headerPane = new ContentPane({ id : 'headerPane', region : 'top' });
    layout.addChild(headerPane);

    var runsTab = new TabContainer({ region : 'center' });
    layout.addChild(runsTab);

    //--- Logo ---//

    CURRENT_PRODUCT = CC_PROD_SERVICE.getCurrentProduct();
    var currentProductName = util.atou(CURRENT_PRODUCT.displayedName_b64);
    document.title = currentProductName + ' - CodeChecker';

    var logoContainer = domConstruct.create('div', {
      id : 'logo-container'
    }, headerPane.domNode);

    var logo = domConstruct.create('span', { id : 'logo' }, logoContainer);

    var logoText = domConstruct.create('div', {
      id : 'logo-text',
      innerHTML : 'CodeChecker ' + CC_SERVICE.getPackageVersion()
    }, logoContainer);

    var title = domConstruct.create('span', {
      id : 'logo-title',
      innerHTML : currentProductName
    }, logoText);

    var user = CC_AUTH_SERVICE.getLoggedInUser();
    var loginUserSpan = null;
    if (user.length > 0) {
      loginUserSpan = domConstruct.create('span', {
        id: 'loggedin',
        innerHTML: "Logged in as " + user + "."
      });
    }

    //--- Back button to product list ---//

    var productListButton = new Button({
      class : 'main-menu-button',
      label : 'Back to product list',
      onClick : function () {
        // Use explicit URL here, as '/' could redirect back to this product
        // if there is only one product.
        window.open('/products.html', '_self');
      }
    });

    var headerMenu = domConstruct.create('div', { id : 'header-menu' });

    var menuButton = new HeaderMenu({
      class : 'main-menu-button',
      iconClass : 'dijitIconFunction',
    });

    if (loginUserSpan != null)
        domConstruct.place(loginUserSpan, headerMenu);

    domConstruct.place(productListButton.domNode, headerMenu);

    domConstruct.place(menuButton.domNode, headerMenu);

    domConstruct.place(headerMenu, headerPane.domNode);

    //--- Center panel ---//

    var listOfRuns = new ListOfRuns({
      title : 'List of runs',
      onLoaded : function (runDataParam) {
        runDataList = runDataParam;
        initByUrl();
      },
      onShow : function () {
        if (!this.initalized) {
          this.initalized = true;
          return;
        }

        hashHelper.clear();
      }
    });

    runsTab.addChild(listOfRuns);

    var listOfAllReports = new ListOfBugs({
      title : 'All reports',
      allReportView : true,
      tab : 'allReports'
    });

    //--- Check static tab ---//

    var checkerStatisticsTab = new CheckerStatistics({
      class : 'checker-statistics',
      title : 'Checker statistics',
      listOfAllReports : listOfAllReports
    });
    runsTab.addChild(checkerStatisticsTab);
    runsTab.addChild(listOfAllReports);

    //--- Init page ---//

    document.body.appendChild(layout.domNode);
    layout.startup();

    //------------------------------- Control --------------------------------//

    var runIdToTab = {};

    topic.subscribe('openRun', function (param) {
      var tabData = param.tabData ? param.tabData : param.runData;

      if (!(tabData.runId in runIdToTab)) {
        runIdToTab[tabData.runId] = new ListOfBugs({
          runData : param.runData,
          title : tabData.name,
          closable : true,
          tab : tabData.name,
          onClose : function () {
            delete runIdToTab[tabData.runId];
            return true;
          }
        });

        runsTab.addChild(runIdToTab[tabData.runId]);
      }

      runsTab.selectChild(runIdToTab[tabData.runId]);
    });

    topic.subscribe('openDiff', function (diff) {
      var tabData = diff.tabData ? diff.tabData : { baseline : diff.baseline,
                                                    newcheck : diff.newcheck };
      var tabId = tabData.baseline.name + '_diff_'
        +  tabData.newcheck.name;

      if (!(tabId in runIdToTab)) {
        runIdToTab[tabId] = new ListOfBugs({
          baseline : diff.baseline,
          newcheck : diff.newcheck,
          difftype : diff.difftype,
          title : 'Diff of '
            + (tabData.baseline ? tabData.baseline.name : 'All')
            + (tabData.newcheck ? ' and ' + tabData.newcheck.name : ''),
          closable : true,
          tab : tabId,
          diffView : true,
          onClose : function () {
            delete runIdToTab[tabId];
            return true;
          }
        });

        runsTab.addChild(runIdToTab[tabId]);
      }

      runsTab.selectChild(runIdToTab[tabId]);
    });

    topic.subscribe('tab/userguide', function () {
      var that = this;

      if (!this.userguide) {
        this.userguide = new ContentPane({
          title : 'User guide',
          closable : true,
          href  : 'userguide/doc/html/md_userguide.html',
          onClose : function () {
            delete that.userguide;
            return true;
          },
          onShow : function () {
            hashHelper.resetStateValues({
              'tab' : 'userguide'
            });
          }
        });
        runsTab.addChild(this.userguide);
      }

      hashHelper.resetStateValues({
        'tab' : 'userguide'
      });
      runsTab.selectChild(this.userguide);
    });

    var docDialog = new Dialog();

    topic.subscribe('showDocumentation', function (checkerId) {
      CC_SERVICE.getCheckerDoc(checkerId, function (documentation) {
        docDialog.set('title', 'Documentation for <b>' + checkerId + '</b>');
        docDialog.set('content', marked(documentation));
        docDialog.show();
      });
    });

    topic.subscribe('tab/allReports', function () {
      runsTab.selectChild(listOfAllReports);
    });

    topic.subscribe('tab/checkerStatistics', function () {
      runsTab.selectChild(checkerStatisticsTab);
    });

    topic.subscribe('tab/listOfRuns', function () {
      runsTab.selectChild(listOfRuns);
    });

    //--- Handle main tabs ---//

    topic.subscribe('/dojo/hashchange', function (url) {
      initByUrl();
    });
  };
});
