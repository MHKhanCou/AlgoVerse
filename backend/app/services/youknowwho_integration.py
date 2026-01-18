import requests
import json
from typing import List, Dict, Optional
from bs4 import BeautifulSoup
import re
from dataclasses import dataclass
from ..models import Algorithm, RelatedProblem, ProblemSourceMapping, PlatformType, ProblemDifficulty, ProblemStatus
from sqlalchemy.orm import Session
from datetime import datetime

@dataclass
class TopicMapping:
    algorithm_name: str
    topic_tags: List[str]
    difficulty_mapping: Dict[str, ProblemDifficulty]
    platform_mapping: Dict[str, PlatformType]

class YouKnowWhoIntegration:
    """Integration service for YouKnowWho Academy topic lists"""
    
    BASE_URL = "https://youkn0wwho.academy"
    TOPIC_LIST_URL = f"{BASE_URL}/topic-list"
    
    # Define algorithm to topic mappings based on the provided context
    ALGORITHM_MAPPINGS = {
        "Binary Search": {
            "tags": ["Binary Search", "Two Pointers", "Monotonicity"],
            "difficulty": ProblemDifficulty.EASY,
            "platforms": [PlatformType.LEETCODE, PlatformType.CODEFORCES]
        },
        "Two Pointers": {
            "tags": ["Two Pointers", "Monotonicity", "Array"],
            "difficulty": ProblemDifficulty.EASY,
            "platforms": [PlatformType.LEETCODE, PlatformType.CODEFORCES]
        },
        "Merge Sort": {
            "tags": ["Merge Sort", "Divide and Conquer", "Sorting"],
            "difficulty": ProblemDifficulty.MEDIUM,
            "platforms": [PlatformType.LEETCODE, PlatformType.CODEFORCES]
        },
        "Quick Sort": {
            "tags": ["Quick Sort", "Divide and Conquer", "Sorting"],
            "difficulty": ProblemDifficulty.MEDIUM,
            "platforms": [PlatformType.LEETCODE, PlatformType.CODEFORCES]
        },
        "Bubble Sort": {
            "tags": ["Bubble Sort", "Basic Sorting", "Array"],
            "difficulty": ProblemDifficulty.BEGINNER,
            "platforms": [PlatformType.LEETCODE, PlatformType.GEEKSFORGEEKS]
        },
        "Selection Sort": {
            "tags": ["Selection Sort", "Basic Sorting", "Array"],
            "difficulty": ProblemDifficulty.BEGINNER,
            "platforms": [PlatformType.LEETCODE, PlatformType.GEEKSFORGEEKS]
        },
        "Insertion Sort": {
            "tags": ["Insertion Sort", "Basic Sorting", "Array"],
            "difficulty": ProblemDifficulty.BEGINNER,
            "platforms": [PlatformType.LEETCODE, PlatformType.GEEKSFORGEEKS]
        },
        "Counting Sort": {
            "tags": ["Counting Sort", "Non-comparison Sorting", "Array"],
            "difficulty": ProblemDifficulty.MEDIUM,
            "platforms": [PlatformType.LEETCODE, PlatformType.CODEFORCES]
        },
        "Radix Sort": {
            "tags": ["Radix Sort", "Non-comparison Sorting", "Array"],
            "difficulty": ProblemDifficulty.MEDIUM,
            "platforms": [PlatformType.LEETCODE, PlatformType.CODEFORCES]
        },
        "Prefix Sum": {
            "tags": ["Prefix Sum", "Range Queries", "Array"],
            "difficulty": ProblemDifficulty.EASY,
            "platforms": [PlatformType.LEETCODE, PlatformType.CODEFORCES]
        },
        "Prefix XOR": {
            "tags": ["Prefix XOR", "Range Queries", "Bitwise"],
            "difficulty": ProblemDifficulty.MEDIUM,
            "platforms": [PlatformType.LEETCODE, PlatformType.CODEFORCES]
        },
        "Greedy": {
            "tags": ["Greedy", "Basic Greedy", "Constructive"],
            "difficulty": ProblemDifficulty.MEDIUM,
            "platforms": [PlatformType.LEETCODE, PlatformType.CODEFORCES]
        },
        "Recursion": {
            "tags": ["Recursion", "Divide and Conquer"],
            "difficulty": ProblemDifficulty.MEDIUM,
            "platforms": [PlatformType.LEETCODE, PlatformType.CODEFORCES]
        },
        "GCD and LCM": {
            "tags": ["GCD", "LCM", "Number Theory", "Math"],
            "difficulty": ProblemDifficulty.EASY,
            "platforms": [PlatformType.LEETCODE, PlatformType.CODEFORCES]
        },
        "Divisors": {
            "tags": ["Divisors", "Number Theory", "Math"],
            "difficulty": ProblemDifficulty.EASY,
            "platforms": [PlatformType.LEETCODE, PlatformType.CODEFORCES]
        },
        "Bitwise Operations": {
            "tags": ["Bitwise", "Bitmasks", "Bit Manipulation"],
            "difficulty": ProblemDifficulty.MEDIUM,
            "platforms": [PlatformType.LEETCODE, PlatformType.CODEFORCES]
        }
    }
    
    # Sample problems for each algorithm (you can expand these)
    SAMPLE_PROBLEMS = {
        "Binary Search": [
            {
                "title": "Binary Search",
                "platform": PlatformType.LEETCODE,
                "difficulty": ProblemDifficulty.EASY,
                "problem_url": "https://leetcode.com/problems/binary-search/",
                "problem_id": "704",
                "description": "Given an array of integers nums which is sorted in ascending order, find the target value.",
                "tags": "Binary Search, Array"
            },
            {
                "title": "Search Insert Position",
                "platform": PlatformType.LEETCODE,
                "difficulty": ProblemDifficulty.EASY,
                "problem_url": "https://leetcode.com/problems/search-insert-position/",
                "problem_id": "35",
                "description": "Given a sorted array of distinct integers and a target value, return the index.",
                "tags": "Binary Search, Array"
            }
        ],
        "Two Pointers": [
            {
                "title": "Two Sum II - Input Array Is Sorted",
                "platform": PlatformType.LEETCODE,
                "difficulty": ProblemDifficulty.MEDIUM,
                "problem_url": "https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/",
                "problem_id": "167",
                "description": "Given a 1-indexed array of integers that is already sorted in non-decreasing order.",
                "tags": "Two Pointers, Array"
            },
            {
                "title": "Container With Most Water",
                "platform": PlatformType.LEETCODE,
                "difficulty": ProblemDifficulty.MEDIUM,
                "problem_url": "https://leetcode.com/problems/container-with-most-water/",
                "problem_id": "11",
                "description": "Find two lines that together with the x-axis form a container with the most water.",
                "tags": "Two Pointers, Array, Greedy"
            }
        ],
        "Merge Sort": [
            {
                "title": "Sort an Array",
                "platform": PlatformType.LEETCODE,
                "difficulty": ProblemDifficulty.MEDIUM,
                "problem_url": "https://leetcode.com/problems/sort-an-array/",
                "problem_id": "912",
                "description": "Given an array of integers nums, sort the array in ascending order.",
                "tags": "Array, Divide and Conquer, Sorting, Heap"
            },
            {
                "title": "Merge Sorted Array",
                "platform": PlatformType.LEETCODE,
                "difficulty": ProblemDifficulty.EASY,
                "problem_url": "https://leetcode.com/problems/merge-sorted-array/",
                "problem_id": "88",
                "description": "Merge nums1 and nums2 into a single array sorted in non-decreasing order.",
                "tags": "Array, Two Pointers, Sorting"
            }
        ],
        "Prefix Sum": [
            {
                "title": "Range Sum Query - Immutable",
                "platform": PlatformType.LEETCODE,
                "difficulty": ProblemDifficulty.EASY,
                "problem_url": "https://leetcode.com/problems/range-sum-query-immutable/",
                "problem_id": "303",
                "description": "Given an integer array nums, handle multiple queries of the sum of elements.",
                "tags": "Array, Design, Prefix Sum"
            },
            {
                "title": "Subarray Sum Equals K",
                "platform": PlatformType.LEETCODE,
                "difficulty": ProblemDifficulty.MEDIUM,
                "problem_url": "https://leetcode.com/problems/subarray-sum-equals-k/",
                "problem_id": "560",
                "description": "Given an array of integers and an integer k, find the total number of subarrays.",
                "tags": "Array, Hash Table, Prefix Sum"
            }
        ]
    }
    
    def __init__(self, db: Session):
        self.db = db
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
    
    def fetch_topic_list(self) -> Dict:
        """Fetch the topic list from YouKnowWho Academy"""
        try:
            response = self.session.get(self.TOPIC_LIST_URL, timeout=10)
            response.raise_for_status()
            return {"status": "success", "content": response.text}
        except requests.exceptions.RequestException as e:
            return {"status": "error", "message": str(e)}
    
    def parse_topics(self, html_content: str) -> List[Dict]:
        """Parse topics from HTML content"""
        try:
            soup = BeautifulSoup(html_content, 'html.parser')
            topics = []
            
            # This is a simplified parser - you'd need to adapt based on actual HTML structure
            # For now, we'll use our predefined mappings
            for algorithm_name, mapping in self.ALGORITHM_MAPPINGS.items():
                topics.append({
                    "name": algorithm_name,
                    "tags": mapping["tags"],
                    "difficulty": mapping["difficulty"],
                    "platforms": mapping["platforms"]
                })
            
            return topics
        except Exception as e:
            print(f"Error parsing topics: {e}")
            return []
    
    def create_problem_mapping(self, algorithm_id: int, algorithm_name: str) -> bool:
        """Create or update problem source mapping for an algorithm"""
        try:
            mapping = self.ALGORITHM_MAPPINGS.get(algorithm_name)
            if not mapping:
                return False
            
            # Check if mapping exists
            existing_mapping = self.db.query(ProblemSourceMapping).filter(
                ProblemSourceMapping.algorithm_id == algorithm_id,
                ProblemSourceMapping.source_name == "YouKnowWho Academy"
            ).first()
            
            topic_tags_json = json.dumps(mapping["tags"])
            
            if existing_mapping:
                existing_mapping.topic_tags = topic_tags_json
                existing_mapping.last_synced = datetime.utcnow()
                existing_mapping.updated_at = datetime.utcnow()
            else:
                new_mapping = ProblemSourceMapping(
                    source_name="YouKnowWho Academy",
                    algorithm_name=algorithm_name,
                    algorithm_id=algorithm_id,
                    topic_tags=topic_tags_json,
                    problem_list_url=self.TOPIC_LIST_URL
                )
                self.db.add(new_mapping)
            
            self.db.commit()
            return True
            
        except Exception as e:
            print(f"Error creating problem mapping: {e}")
            self.db.rollback()
            return False
    
    def suggest_problems(self, algorithm_id: int, algorithm_name: str, user_id: int) -> List[Dict]:
        """Suggest problems for a specific algorithm"""
        try:
            # First create/update the mapping
            self.create_problem_mapping(algorithm_id, algorithm_name)
            
            # Get sample problems for this algorithm
            sample_problems = self.SAMPLE_PROBLEMS.get(algorithm_name, [])
            
            suggested_problems = []
            for problem_data in sample_problems:
                # Check if problem already exists
                existing_problem = self.db.query(RelatedProblem).filter(
                    RelatedProblem.algorithm_id == algorithm_id,
                    RelatedProblem.problem_id == problem_data.get("problem_id"),
                    RelatedProblem.platform == problem_data["platform"]
                ).first()
                
                if not existing_problem:
                    # Create new problem suggestion
                    new_problem = RelatedProblem(
                        title=problem_data["title"],
                        platform=problem_data["platform"],
                        difficulty=problem_data["difficulty"],
                        problem_url=problem_data["problem_url"],
                        problem_id=problem_data.get("problem_id"),
                        description=problem_data.get("description"),
                        tags=problem_data.get("tags"),
                        algorithm_id=algorithm_id,
                        source="YouKnowWho Academy Auto-Suggest",
                        is_auto_suggested=True,
                        created_by=user_id,
                        status=ProblemStatus.PENDING  # Require admin approval
                    )
                    
                    self.db.add(new_problem)
                    suggested_problems.append({
                        "title": problem_data["title"],
                        "platform": problem_data["platform"].value,
                        "difficulty": problem_data["difficulty"].value,
                        "status": "suggested"
                    })
            
            self.db.commit()
            return suggested_problems
            
        except Exception as e:
            print(f"Error suggesting problems: {e}")
            self.db.rollback()
            return []
    
    def sync_all_algorithms(self, user_id: int) -> Dict:
        """Sync problems for all algorithms in the database"""
        try:
            algorithms = self.db.query(Algorithm).all()
            total_suggested = 0
            
            for algorithm in algorithms:
                problems = self.suggest_problems(algorithm.id, algorithm.name, user_id)
                total_suggested += len(problems)
            
            return {
                "status": "success",
                "message": f"Successfully suggested {total_suggested} problems across {len(algorithms)} algorithms",
                "total_algorithms": len(algorithms),
                "total_suggested": total_suggested
            }
            
        except Exception as e:
            return {
                "status": "error",
                "message": f"Error during sync: {str(e)}"
            }

def get_youknowwho_service(db: Session) -> YouKnowWhoIntegration:
    """Factory function to get YouKnowWho integration service"""
    return YouKnowWhoIntegration(db)
