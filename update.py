import aiohttp
import asyncio
import json
import os

async def fetch(session, hash_value, name):
    api_url = f'https://api2.ordinalsbot.com/search?hash={hash_value}'
    async with session.get(api_url) as response:
        api_response = await response.json()

    count = api_response['count']
    inscriptionid = None if count == 0 else api_response['results'][0]['inscriptionid'] if count == 1 else min(api_response['results'], key=lambda x: x['createdat'])['inscriptionid']

    return {'name': name, 'hash': hash_value, 'inscriptionid': inscriptionid, 'inscribed': count}

async def update_status(session, status_list):
    tasks = [fetch(session, item['hash'], item['name']) for item in status_list]
    api_responses = await asyncio.gather(*tasks)

    name_to_inscriptionid = {}

    for status_item, api_response in zip(status_list, api_responses):
        if status_item['inscribed'] == 0:
            status_item['inscriptionid'] = api_response['inscriptionid']
            status_item['inscribed'] = api_response['inscribed']

        # Build a mapping of name to inscriptionid
        name_to_inscriptionid[status_item['name']] = status_item['inscriptionid']

    return name_to_inscriptionid

def initialize_status_file(status_file_path, items_count):
    initial_status = {
        "mintedNumber": 0,
        "data": [None] * items_count
    }

    with open(status_file_path, 'w') as status_file:
        json.dump(initial_status, status_file, indent=2)

async def main():
    items_file_path = 'data/items.json'
    status_file_path = 'data/status.json'

    # Read items.json
    with open(items_file_path, 'r') as items_file:
        items_data = json.load(items_file)

    # Check if status.json exists, if not, initialize it
    if not os.path.isfile(status_file_path):
        initialize_status_file(status_file_path, len(items_data))

    # Read status.json
    with open(status_file_path, 'r') as status_file:
        status_data = json.load(status_file)

    # Reset mintedNumber to 0
    minted_count = 0

    # Prepare status_list with name and hash
    status_list = [{'name': item['name'], 'hash': item['hash'], 'inscriptionid': None, 'inscribed': 0} for item in items_data]

    print("Starting hash check. This may take a few minutes...")
    async with aiohttp.ClientSession() as session:
        name_to_inscriptionid = await update_status(session, status_list)

    # Calculate minted_count after async tasks are completed
    minted_count = sum(1 for item in status_list if item['inscribed'] != 0)

    # Update status.json
    status_data['mintedNumber'] = minted_count
    status_data['data'] = [name_to_inscriptionid[item['name']] for item in status_list]

    with open(status_file_path, 'w') as status_file:
        json.dump(status_data, status_file, indent=2)

    print("Update status completed.")

if __name__ == "__main__":
    asyncio.run(main())
