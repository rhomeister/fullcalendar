function ResourceSelectionManager(t) {
    var t = this;
    var trigger = t.trigger;
    var getResource = t.getResource;
    var sm = SelectionManager.call(t);
    t.sm_reportSelection = t.reportSelection;
    t.reportSelection = resourceReportSelection;
    t.sm_reportDayClick = t.reportDayClick;
    t.reportDayClick = resourceReportDayClick;

    function resourceReportSelection(startDate, endDate, allDay, ev) {
        var col = calcColNumber(startDate);
        ev.resource_id = getResource(col).id;
        t.sm_reportSelection(startDate, endDate, allDay, ev);
    }

    function resourceReportDayClick(date, allDay, ev) {
        var col = calcColNumber(date);
        ev.resource_id = getResource(col).id;
        t.sm_reportDayClick(date, allDay, ev);
    }

    // Fixes issue #2
    function calcColNumber(startDate) {
        return moment(startDate).diff(moment(t.start), "days"); // Introduces dependency on moment.js lib
    }
}
