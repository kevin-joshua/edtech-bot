
# Pre Class Conversion
def json_to_markdown_for_pre_class(data) -> str:
    md = []

    # Overview
    md.append("## 📚 Overview")
    md.append(data.get("overview", ""))

    # Key Concepts
    md.append("\n## 🧩 Key Concepts")
    for concept in data.get("key_concepts", []):
        md.append(f"- {concept}")

    # Short Example
    md.append("\n## 💡 Short Example")
    md.append(data.get("short_example", ""))

    # Pre-class Reading Materials
    md.append("\n## 📖 Pre-class Reading Materials")
    for material in data.get("pre_class_reading_materials", []):
        md.append(f"- {material}")

    # Pre-class Activities
    md.append("\n## 🎓 Pre-class Activities")
    for activity in data.get("pre_class_activities", []):
        md.append(f"\n### {activity.get('activity_title', '')}")
        md.append(f"\n**Description:** {activity.get('description', '')}")
        md.append(f"\n**Instructions:** {activity.get('instructions', '')}")

    return "\n".join(md)



# In Class Conversion
def json_to_markdown_for_in_class(data: dict) -> str:
    md = []

    # Learning Objectives
    md.append("## 🧠 Learning Objectives")
    for obj in data.get("learning_objectives", []):
        md.append(f"- {obj}")

    # Materials Needed
    md.append("\n## 🛠️ Materials Needed")
    for item in data.get("materials_needed", []):
        md.append(f"- {item}")

    # Class Activities
    md.append("\n## 🎯 Class Activities")
    for activity in data.get("class_activities", []):
        md.append(f"\n### {activity.get('activity_title', '')}")
        md.append(f"**Duration:** {activity.get('duration', '')}")
        md.append(f"\n**Description:** {activity.get('description', '')}")
        md.append(f"\n**Teaching Script:**\n{activity.get('teaching_script', '')}")

    # Assessment Methods
    md.append("\n## 📝 Assessment Methods")
    for method in data.get("assessment_methods", []):
        md.append(f"- {method}")

    # Summary
    md.append("\n## 📌 Summary")
    md.append(data.get("summary", ""))

    return "\n".join(md)


# Post Class Conversion
def json_to_markdown_for_post_class(data: dict) -> str:
    md = []

    # Quiz
    md.append("## ❓ Quiz")
    for question in data.get("quiz", []):
        md.append(f"\n### {question.get('question', '')}")
        for option in question.get("options", []):
            md.append(f"- {option}")
        md.append(f"\n**Answer:** {question.get('answer', '')}")

    # Summary
    md.append("\n## 📚 Summary")
    md.append(data.get("summary", ""))

    return "\n".join(md)