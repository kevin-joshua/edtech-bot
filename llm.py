import google.generativeai as genai
import os



genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel(
          model_name="gemini-1.5-pro",
          generation_config={
              "temperature": 0.35,
              "max_output_tokens": 1024,
          }
      )

def generate_in_class_content(prompt: str, difficulty: str) -> str:
  system_prompt = """
                  You are an expert educator creating structured lesson plans for placement preparatory classes for mentors/teachers.
                    Generate a structured lesson plan along with teaching script for a 1 hour class on a given topic based on the difficulty level.
                    The lesson plan should include:
                    - Learning objectives
                    - Materials needed
                    - Class activities
                    - Assessment methods
                    - Teaching script for each activity
                    
                    The response should be in JSON format with the following structure:
                    {
          "learning_objectives": [
            "Objective 1",
            "Objective 2",
            ...
          ],
          "materials_needed": [
            "Item 1",
            "Item 2",
            ...
          ],
          "class_activities": [
            {
              "activity_title": "Title of the activity",
              "duration": "15 minutes",
              "description": "Explain what the activity is about",
              "teaching_script": "Write the exact words or plan the mentor should follow during this activity, flow of topics, examples to use, etc and key points to cover. This should be detailed enough for a mentor to follow without needing additional context.",
            },
            ...
          ],
          "assessment_methods": [
            "Method 1",
            "Method 2"
          ],
          "summary": "Wrap up the class with key takeaways"
        }            
                    """
  
  response = model.generate_content(
   system_prompt + "\n\n" + prompt + "\n\n" + difficulty,
  )

  
  # if response.error:
  #   raise Exception(f"Error generating content: {response.error.message}")
  
  pre_class_content = generate_pre_class_content(response.text.strip(), difficulty)
  post_class_content = generate_post_class_content(response.text.strip(), difficulty)
  in_class_content = response.text.strip()
  return {
    "in_class_content": in_class_content,
    "pre_class_content": pre_class_content,
    "post_class_content": post_class_content
  }



def generate_pre_class_content(in_class_content: str, difficulty: str) -> str:
    system_prompt = """
                  You are an expert educator creating pre-class content based on the in-class content provided for students.
                    Generate a structured pre-class content that includes:
                    - Pre-class reading materials
                    - Pre-class activities
                    Pre-class content should be designed to prepare students for the in-class activities.
                    The difficulty level of the topic is {difficulty}.
                    The response should be in JSON format with the following structure:
                    {
                    "overview": "Brief 1-paragraph introduction to the topic, why it's important, and what students will learn.",
                    "key_concepts": [
                      "Concept 1 - short explanation",
                      "Concept 2 - short explanation",
                      ...
                    ],
                    "short_example": "A small, simple example that gives an intuitive feel for the topic.",
                    "pre_class_reading_materials": [
                      "Material 1 - brief description",
                      "Material 2 - brief description",
                      ...
                    ],
                    "pre_class_activities": [
                      {
                        "activity_title": "Title of the activity",
                        "description": "Explain what the activity is about",
                        "instructions": "Detailed instructions for the students to follow"
                      },
                      ...
                    ]
                  }
                  """
   
    response = model.generate_content(
       system_prompt + "\n\n" + in_class_content,
    )
    # if response.error:
    #     raise Exception(f"Error generating pre-class content: {response.error.message}")
    return response.text.strip()


def generate_post_class_content(in_class_content: str, difficulty: str) -> str:
    system_prompt = """
                  You are an expert educator creating post-class content based on the in-class content provided for students.
                    Generate a structured post-class content that includes:
                    -Quiz (6-10 questions) with answers
                    -Summary to reinforce key concepts learned in class
                    Post-class content should be designed to reinforce learning and assess understanding.
                    The difficulty level of the topic is {difficulty}.
                    The response should be in JSON format with the following structure:
                    {
                    "quiz": [
                      {
                        "question": "Question 1",
                        "options": [
                          "Option A",
                          "Option B",
                          "Option C",
                          "Option D"
                        ],
                        "answer": "Correct Option"
                      },
                      ...
                    ],
                    "summary": "Wrap up the class with key takeaways and important concepts"
                  }
                  """
   
    response = model.generate_content(
       system_prompt + "\n\n" + in_class_content,
    )
    # if response.error:
    #     raise Exception(f"Error generating post-class content: {response.error.message}")
    
    
    return response.text.strip()


