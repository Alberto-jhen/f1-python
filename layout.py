import fastf1 as fastf1

session = fastf1.get_session(2021, 7, 'Q')
print(session)

# "session.event" to get the full session event
print(session.event['EventName'])

# Can also load the event by using the following function.
event = fastf1.get_event(2021, 7)

# Another way to select an event is by passing the event name by parameter
# To work precissely is necessary to pass the complete GP name
spanish_22_event = fastf1.get_event(2022, "Spain")
print(spanish_22_event['EventName'])

schedule = fastf1.get_event_schedule(2025)
print(schedule)
print(schedule.columns)

austin_25_gp = schedule.get_event_by_name('Austin')

session.load()
results_french_21_gp = session.results
print(session.results)