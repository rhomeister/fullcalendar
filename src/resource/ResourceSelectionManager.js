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
        period = correctPeriod(startDate, endDate);
        startDate = period[0];
        endDate = period[1];
        ev.resource_id = getResource(col).id;
        t.sm_reportSelection(startDate, endDate, allDay, ev);
    }

    function resourceReportDayClick(date, allDay, ev) {
        var col = calcColNumber(date);
        correctDate(date);
        ev.resource_id = getResource(col).id;
        t.sm_reportDayClick(date, allDay, ev);
    }

    // Fixes issue #2
    function calcColNumber(startDate) {
        return moment(startDate).diff(moment(t.start), "days"); // Introduces dependency on moment.js lib
    }

    // Fixes issue #3
    function correctDate(date) {
        date.setFullYear(t.start.getFullYear(), t.start.getMonth(), t.start.getDate());
        return date;
    }
    function correctPeriod(startDate, endDate){
        if(startDate.clone().endOfDay().getTime() == endDate.getTime()){
            var startDate = correctDate(startDate);
            var endDate = startDate.clone().endOfDay();
        } else {
            var startDate = correctDate(startDate);
            var endDate = correctDate(endDate);
        }
        return new Array(startDate, endDate);
    }
}
