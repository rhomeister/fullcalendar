fcViews.resource = ResourceDayView;

function ResourceDayView(element, calendar) {
    var t = this;


    // exports
    t.render = render;

    // imports
    ResourceView.call(t, element, calendar, 'resource');
    var opt = t.opt;
    var renderResource = t.renderResource;
    var formatDates = calendar.formatDates;

    function render(date, delta) {
        if (delta) {
            addDays(date, delta);
        }        
        t.title = formatDate(date, opt('titleFormat'), calendar.options);
        t.start = cloneDate(date, true);
        t.end = cloneDate(t.start, true);
        t.end.setHours(24,0,0,0); // BRWR: JSON event sources pull data based on ISO date/time string. End needs to be at end of day. Relies on custom endOfDay() method on date.
        t.visStart = cloneDate(t.start, true);
        t.visEnd = cloneDate(t.start, true)
        t.visEnd.setHours(24,0,0,0); // BRWR: JSON event sources pull data based on ISO date/time string. End needs to be at end of day. Relies on custom endOfDay() method on date.
        renderResource(1);
    }
}
