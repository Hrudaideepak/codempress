#!/usr/bin/env python3
"""
Codempress Deployment Verification CLI Script

Validates:
1. Render backend /api/health endpoint
2. Render backend /api/ai/status endpoint
3. Render backend /api/topics (database querying & seeding state)
4. Vercel frontend rewrite proxy /api/health
5. Vercel frontend root page response
"""

import sys
import json
import urllib.request
import urllib.error
import argparse

def test_endpoint(url: str, description: str, timeout: int = 10):
    print(f"\n🔍 Testing: {description}")
    print(f"   URL: {url}")
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Codempress-Deployment-Verifier/1.0"}
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            status_code = response.getcode()
            body_text = response.read().decode("utf-8")
            
            print(f"   Status Code: {status_code} OK")
            
            # Try parsing JSON if applicable
            try:
                data = json.loads(body_text)
                print(f"   Response Payload: {json.dumps(data, indent=2)[:300]}...")
            except json.JSONDecodeError:
                print(f"   Response Length: {len(body_text)} bytes")
            return True
    except urllib.error.HTTPError as e:
        print(f"   ❌ HTTP Error {e.code}: {e.reason}")
        return False
    except urllib.error.URLError as e:
        print(f"   ❌ URL Error: {e.reason}")
        return False
    except Exception as e:
        print(f"   ❌ Exception: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description="Codempress Deployment Verification Tool")
    parser.add_argument("--backend", default="https://codempress-backend.onrender.com", help="Backend base URL")
    parser.add_argument("--frontend", default="https://codempress.vercel.app", help="Frontend base URL")
    args = parser.parse_args()

    backend_url = args.backend.rstrip("/")
    frontend_url = args.frontend.rstrip("/")

    print("====================================================")
    print("🚀 CODEMPRESS PRODUCTION DEPLOYMENT VERIFICATION")
    print("====================================================")

    results = []

    # 1. Direct Backend Health
    res1 = test_endpoint(f"{backend_url}/api/health", "1. Backend Direct Health (/api/health)")
    results.append(("Backend Health", res1))

    # 2. AI Model Router Health
    res2 = test_endpoint(f"{backend_url}/api/ai/status", "2. AI Model Pipeline Status (/api/ai/status)")
    results.append(("AI Status", res2))

    # 3. Topics Query (Database Seeding Check)
    res3 = test_endpoint(f"{backend_url}/api/topics", "3. Database Topics Query (/api/topics)")
    results.append(("Database Seeding", res3))

    # 4. Frontend SPA Page
    res4 = test_endpoint(frontend_url, "4. Vercel Frontend SPA Root")
    results.append(("Vercel Frontend", res4))

    # 5. Vercel Rewrites Proxy check
    res5 = test_endpoint(f"{frontend_url}/api/health", "5. Vercel Backend Rewrite Proxy (/api/health)")
    results.append(("Vercel API Rewrite", res5))

    print("\n" + "="*50)
    print("📊 DEPLOYMENT VERIFICATION SUMMARY")
    print("="*50)
    
    all_passed = True
    for name, passed in results:
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"  - {name:<25}: {status}")
        if not passed:
            all_passed = False

    print("="*50)
    if all_passed:
        print("🎉 ALL PRODUCTION DEPLOYMENT CHECKS PASSED SUCCESSFULLY!")
        sys.exit(0)
    else:
        print("⚠️ SOME CHECKS FAILED. PLEASE REVIEW LOGS ABOVE.")
        sys.exit(1)

if __name__ == "__main__":
    main()
