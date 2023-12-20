import datetime

# Get the current time
current_time = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

# Write the current time to last_updated.txt
with open('last_updated.txt', 'w') as file:
    file.write(current_time)

print('Data updated successfully.')
