import httpx

print("Querying backend directly in local dev mode...")

# Fetch subjects
print("\nFetching subjects...")
resp = httpx.get("http://localhost:8008/api/subjects")
print("Subjects status:", resp.status_code)
if resp.status_code == 200:
    subjects_data = resp.json()
    subjects = subjects_data.get("subjects", [])
    print("Total subjects returned:", len(subjects))
    if subjects:
        print("Sample subject:", subjects[0])
else:
    print("Error fetching subjects:", resp.text)

# Fetch library
print("\nFetching library...")
resp = httpx.get("http://localhost:8008/api/library")
print("Library status:", resp.status_code)
if resp.status_code == 200:
    library_data = resp.json()
    categories = library_data.get("categories", [])
    print("Total categories returned:", len(categories))
    if categories:
        print("Sample category name:", categories[0]["name"])
        print("Sample category topics count:", len(categories[0].get("topics", [])))
        if categories[0].get("topics"):
            print("Sample topic:", categories[0]["topics"][0])
else:
    print("Error fetching library:", resp.text)
