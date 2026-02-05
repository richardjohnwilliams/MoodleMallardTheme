Õ3import os
import re

source_file = r"c:/Users/ucqnrwi/AntiGemini/Moodle/EDI/Week 7 Widening Participation & Out.txt"
output_dir = r"c:/Users/ucqnrwi/AntiGemini/Moodle/EDI/Week 7"

if not os.path.exists(output_dir):
    os.makedirs(output_dir)

with open(source_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Define the top-level sections
sections = [
    {
        "id": "7.1.1",
        "marker": "7.1.1 Widening Participation, Outreach and Public Engagement:",
        "filename": "7.1.1_Widening_Participation_Outreach_and_Public_Engagement.html",
        "is_book": False
    },
    {
        "id": "7.1.2",
        "marker": "and then, 7.1.2 The Multi-faceted Imperative for EDI:",
        "filename": "7.1.2_The_Multi_faceted_Imperative_for_EDI.html",
        "is_book": False
    },
    {
        "id": "7.1.3",
        "marker": "and then, 7.1.3 Understanding Access and Participation Plans (APPs):",
        "filename": "7.1.3_Understanding_Access_and_Participation_Plans_APPs.html",
        "is_book": False
    },
    {
        "id": "7.2.1",
        "marker": "7.2.1 Socioeconomic Disparities: Barriers Across Family, Environment, and Education, which contains six chapters:",
        "base_filename": "7.2.1_Chapter",
        "is_book": True,
        "chapter_names": [
            "Foundations_of_Socioeconomic_Disparity",
            "The_University_Success_Triangle",
            "The_Role_of_Schools_and_Teachers",
            "The_Impact_of_Teacher_Shortages",
            "Barriers_to_Participation",
            "The_Hidden_Curriculum"
        ]
    },
    {
        "id": "7.2.2",
        "marker": "And then, 7.2.2 Analysing Socioeconomic Disparities:",
        "filename": "7.2.2_Analysing_Socioeconomic_Disparities.html",
        "is_book": False
    },
    {
        "id": "7.2.3",
        "marker": "and then, 7.2.3 Gender and Ethnic Disparities in STEM, which contains five chapters:",
        "base_filename": "7.2.3_Chapter",
        "is_book": True,
        "chapter_names": [
            "Gender_and_Ethnic_Underrepresentation",
            "Gender_Disparities_in_STEM",
            "Ethnic_Disparities_in_STEM",
            "Stereotype_Threat_and_Identity",
            "Implicit_Bias"
        ]
    },
    {
        "id": "7.3.1",
        "marker": "7.3.1 Pre-University Pathways:",
        "filename": "7.3.1_Pre_University_Pathways.html",
        "is_book": False
    },
    {
        "id": "7.3.2",
        "marker": "and then, 7.3.2 Retention, Progression, and Belonging in Higher Education:",
        "filename": "7.3.2_Retention_Progression_and_Belonging_in_Higher_Education.html",
        "is_book": False
    },
    {
        "id": "7.3.3",
        "marker": "and then, 7.3.3 Systemic Bias and Inclusive Research Cultures:",
        "filename": "7.3.3_Systemic_Bias_and_Inclusive_Research_Cultures.html",
        "is_book": False
    },
    {
        "id": "7.3.4",
        "marker": "and then, 7.3.4 Widening Participation and Outreach Strategy Brief:",
        "filename": "7.3.4_Widening_Participation_and_Outreach_Strategy_Brief.html",
        "is_book": False
    },
    {
        "id": "7.4.1",
        "marker": "7.4.1 Conclusion and Future Directions:",
        "filename": "7.4.1_Conclusion_and_Future_Directions.html",
        "is_book": False
    }
]

# Find start indices
for i, section in enumerate(sections):
    start_idx = content.find(section["marker"])
    if start_idx == -1:
        print(f"Error: Marker not found for {section['id']}")
        continue
    
    # The content starts AFTER the marker line. 
    # We can find the end of the marker line.
    marker_end_idx = start_idx + len(section["marker"])
    
    # Find the start of the NEXT section to define the end of this one
    if i < len(sections) - 1:
        next_marker = sections[i+1]["marker"]
        end_idx = content.find(next_marker)
        if end_idx == -1:
             print(f"Error: Next marker not found for section after {section['id']}")
             end_idx = len(content)
    else:
        end_idx = len(content)
    
    section_content = content[marker_end_idx:end_idx].strip()
    
    if section["is_book"]:
        # Split by chapters
        # Chapters look like "Chapter X: <!-- ... -->" or "Chapter X: <div..."
        # We can regex split, but we need to keep the content associated with each.
        
        # Let's find all "Chapter \d+:" occurrences
        chapter_pattern = re.compile(r'(Chapter \d+:.*)')
        parts = chapter_pattern.split(section_content)
        
        # parts[0] might be empty or whitespace if the first chapter starts immediately
        # parts[1] is "Chapter 1: ...", parts[2] is content of ch1, parts[3] is "Chapter 2: ...", etc.
        
        current_chapter_idx = 0
        
        # Skip preamble if any (usually empty or just whitespace)
        start_k = 1 if not parts[0].strip() else 0
        
        # If the split didn't work as expected (e.g. no chapters found), warn
        if len(parts) < 2:
             print(f"Warning: No chapters found in {section['id']}")
             # Fallback: write entire content to one file if chapters not found?
             # Or just skip.
             continue

        for k in range(1, len(parts), 2):
            if current_chapter_idx >= len(section["chapter_names"]):
                break
                
            header = parts[k] # e.g. "Chapter 1: <!-- ... -->"
            body = parts[k+1] if k+1 < len(parts) else ""
            
            # Clean header: remove "Chapter \d+:"
            clean_header = re.sub(r'Chapter \d+:', '', header).strip()
            
            full_chapter_content = clean_header + "\n" + body
            full_chapter_content = full_chapter_content.strip()
            
            chapter_name = section["chapter_names"][current_chapter_idx]
            fname = f"{section['id']}_Chapter_{current_chapter_idx+1}_{chapter_name}.html"
            
            with open(os.path.join(output_dir, fname), 'w', encoding='utf-8') as out_f:
                out_f.write(full_chapter_content)
            
            print(f"Created {fname}")
            current_chapter_idx += 1
            
    else:
        # Single file
        with open(os.path.join(output_dir, section["filename"]), 'w', encoding='utf-8') as out_f:
            out_f.write(section_content)
        print(f"Created {section['filename']}")

print("Processing complete.")
› *cascade08›¥*cascade08¥ð *cascade08ðú*cascade08úÕ3 *cascade082@file:///c:/Users/ucqnrwi/AntiGemini/Moodle/EDI/process_week_7.py