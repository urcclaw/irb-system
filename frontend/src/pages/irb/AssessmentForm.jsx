import React, { useState, useEffect } from 'react';
import api from '../../api';
import { useParams, useNavigate } from 'react-router-dom';

// ================= DATA: 44 Assessment Items =================
const SECTION_A_ITEMS = [
  { id: 'a1', label: '1. หลักการและเหตุผล (Rationale)' },
  { id: 'a2', label: '2. การทบทวนวรรณกรรมที่เกี่ยวข้อง' },
  { id: 'a3', label: '3. วัตถุประสงค์ (Objective)' },
  { id: 'a4', label: '4. รูปแบบการวิจัย (Study design)' },
  { id: 'a5', label: '5. กลุ่มประชากรที่ศึกษา (Study population)' },
  { id: 'a6', label: '6. ขนาดตัวอย่าง (Sample size)' },
  { id: 'a7', label: '7. การคัดเลือกผู้เข้ารับการวิจัยเข้าโครงการ (Inclusion criteria)' },
  { id: 'a8', label: '8. การคัดผู้เข้ารับการวิจัยออกจากโครงการวิจัย (Exclusion criteria)' },
  { id: 'a9', label: '9. การแบ่งกลุ่มอาสาสมัคร' },
  { id: 'a10', label: '10. วิธีทดสอบที่ใช้ในการวิจัย' },
  { id: 'a11', label: '11. การใช้กลุ่มควบคุมหรือยาหลอก' },
  { id: 'a12', label: '12. การใช้เครื่องมือแพทย์' },
  { id: 'a13', label: '13. วิธีการวัดผลการวิจัย' },
  { id: 'a14', label: '14. การเฝ้าระวังผลแทรกซ้อนและการแก้ไข' },
  { id: 'a15', label: '15. จำนวนและปริมาณของเลือดหรือสิ่งส่งตรวจ' },
  { id: 'a16', label: '16. ระยะเวลาและจำนวนครั้งของการติดตามผล' },
  { id: 'a17', label: '17. สถิติที่ใช้ในการวิเคราะห์' }
];

const SECTION_B_ITEMS = [
  { id: 'b1', label: '1. มีกลุ่มเปราะบาง ระบุ....................... ซึ่งจำเป็นต้องทำวิจัยในกลุ่มนี้' },
  { id: 'b2', label: '2. แนวทางการปกป้องกลุ่มเปราะบาง' },
  { id: 'b3', label: '3. ความเสี่ยงโดยตรงต่อผู้เข้ารับการวิจัย (ร่างกาย, จิตใจ, สังคม/เศรษฐกิจ, กฎหมาย)' },
  { id: 'b4', label: '4. ความเสี่ยงต่อสุขภาพของตัวอ่อนหรือบุตรในครรภ์หรือคู่สมรส' },
  { id: 'b5', label: '5. ผู้วิจัยมีมาตรการเพียงพอที่จะป้องกันไม่ให้เกิดความเสี่ยงต่อผู้เข้ารับการวิจัย' },
  { id: 'b6', label: '6. ความเสี่ยงต่อชุมชนของผู้เข้ารับการวิจัยที่เข้าร่วมการวิจัย' },
  { id: 'b7', label: '7. ประโยชน์ต่อผู้เข้ารับการวิจัยโดยตรง (ในระหว่าง / หลังเสร็จสิ้น)' },
  { id: 'b8', label: '8. ประโยชน์ต่อชุมชนที่เข้าร่วมการวิจัย' },
  { id: 'b9', label: '9. ประโยชน์ต่อสังคม' }
];

const SECTION_C_ITEMS = [
  { id: 'c1', label: '1. วิธีการชักชวนผู้เข้ารับการวิจัยเข้าสู่โครงการ (ผู้ขอ, เวลา, สถานที่)' },
  { id: 'c2', label: '2. การแจ้งวัตถุประสงค์ของการวิจัย' },
  { id: 'c3', label: '3. ระบุแหล่งทุนสนับสนุน' },
  { id: 'c4', label: '4. ขั้นตอนการปฏิบัติตัวของผู้เข้ารับการวิจัย' },
  { id: 'c5', label: '5. ระบุความเสี่ยงและผลแทรกซ้อน' },
  { id: 'c6', label: '6. ประโยชน์ที่ได้รับจากการเข้าร่วมวิจัย' },
  { id: 'c7', label: '7. การเข้าร่วมโครงการเป็นโดยสมัครใจ' },
  { id: 'c8', label: '8. ทางเลือกอื่นหากไม่เข้าร่วมโครงการ' },
  { id: 'c9', label: '9. สิทธิในการถอนตัวจากโครงการวิจัย' },
  { id: 'c10', label: '10. การจ่ายค่าตอบแทน/ค่าเดินทาง/ค่าใช้จ่าย/ค่าชดเชย' },
  { id: 'c11', label: '11. การเก็บรักษาความลับของผู้เข้ารับการวิจัย' },
  { id: 'c12', label: '12. ชื่อ ที่อยู่และเบอร์โทรศัพท์ติดต่อผู้วิจัย' },
  { id: 'c13', label: '13. ที่อยู่และเบอร์โทรศัพท์ติดต่อคณะกรรมการ' },
  { id: 'c14', label: '14. วิธีการแสดงความยินยอมของผู้เข้ารับการวิจัย' },
  { id: 'c15', label: '15. การขอความยินยอมจากผู้เข้ารับการวิจัยเด็ก' }
];

const SECTION_D_ITEMS = [
  { id: 'd1', label: '1. พื้นฐานอาชีพและประสบการณ์ของผู้วิจัย' },
  { id: 'd2', label: '2. ประวัติการอบรมจริยธรรมการวิจัยของผู้วิจัยและผู้ร่วมโครงการ' },
  { id: 'd3', label: '3. ผลประโยชน์ทับซ้อน (Conflict of interest)' }
];

// ================= HELPER FUNCTION =================
const initializeSectionData = (items, defaultStatus = 'suitable', exceptions = {}) => {
  const data = {};
  items.forEach(item => {
    data[item.id] = {
      status: exceptions[item.id] || defaultStatus,
      comment: ''
    };
  });
  return data;
};

// ✅ ฟังก์ชันช่วย merge ข้อมูลเก่ากับค่าเริ่มต้น
const mergeWithDefaults = (savedData, defaultData) => {
  if (!savedData || typeof savedData !== 'object') return defaultData;
  
  const merged = { ...defaultData };
  Object.keys(savedData).forEach(key => {
    if (savedData[key] && typeof savedData[key] === 'object') {
      merged[key] = {
        status: savedData[key].status || defaultData[key]?.status || 'na',
        comment: savedData[key].comment || ''
      };
    }
  });
  return merged;
};

// ================= COMPONENTS =================
const AssessmentRow = ({ item, section, formData, setFormData }) => {
  const updateStatus = (status) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [item.id]: { 
          ...prev[section][item.id], 
          status: status 
        }
      }
    }));
  };

  const updateComment = (comment) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [item.id]: { 
          ...prev[section][item.id], 
          comment: comment 
        }
      }
    }));
  };

  const current = formData[section]?.[item.id] || { status: 'na', comment: '' };

  return (
    <tr className="border-b hover:bg-gray-50 transition-colors">
      <td className="p-3 text-sm text-gray-800 w-1/3 align-top">{item.label}</td>
      <td className="p-2 text-center align-middle">
        <input 
          type="radio" 
          name={`${section}_${item.id}`} 
          value="suitable" 
          checked={current.status === 'suitable'} 
          onChange={() => updateStatus('suitable')} 
          className="w-4 h-4 text-green-600 focus:ring-green-500" 
        />
      </td>
      <td className="p-2 text-center align-middle">
        <input 
          type="radio" 
          name={`${section}_${item.id}`} 
          value="not_suitable" 
          checked={current.status === 'not_suitable'} 
          onChange={() => updateStatus('not_suitable')} 
          className="w-4 h-4 text-red-600 focus:ring-red-500" 
        />
      </td>
      <td className="p-2 text-center align-middle">
        <input 
          type="radio" 
          name={`${section}_${item.id}`} 
          value="na" 
          checked={current.status === 'na'} 
          onChange={() => updateStatus('na')} 
          className="w-4 h-4 text-gray-600 focus:ring-gray-500" 
        />
      </td>
      <td className="p-2 align-middle">
        <input 
          type="text" 
          placeholder="ข้อสังเกต/ข้อแนะนำ" 
          value={current.comment || ''} 
          onChange={(e) => updateComment(e.target.value)} 
          className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" 
        />
      </td>
    </tr>
  );
};

const SectionTable = ({ title, items, sectionKey, formData, setFormData }) => (
  <div className="mb-8 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
    <h3 className="text-lg font-bold text-blue-800 mb-4 border-b pb-2 flex items-center">
      <span className="bg-blue-100 text-blue-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded">{title}</span>
    </h3>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-100 text-gray-700">
          <tr>
            <th className="p-3 text-left font-semibold">หัวข้อการประเมิน</th>
            <th className="p-2 text-center font-semibold w-24">เหมาะสม</th>
            <th className="p-2 text-center font-semibold w-28">ไม่เหมาะสม*</th>
            <th className="p-2 text-center font-semibold w-28">ไม่เกี่ยวข้อง</th>
            <th className="p-3 text-left font-semibold">ข้อสังเกต/ข้อแนะนำ</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <AssessmentRow 
              key={item.id} 
              item={item} 
              section={sectionKey} 
              formData={formData} 
              setFormData={setFormData} 
            />
          ))}
        </tbody>
      </table>
    </div>
    <p className="text-xs text-red-600 mt-3 font-medium">* หากไม่เหมาะสมขอให้ระบุรายละเอียดในช่องข้อสังเกต/ข้อแนะนำ</p>
  </div>
);

// ================= MAIN FORM =================
export default function AssessmentForm() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [reviewId, setReviewId] = useState(null);

  const getInitialFormData = () => ({
    section_a: initializeSectionData(SECTION_A_ITEMS, 'suitable'),
    section_b: initializeSectionData(SECTION_B_ITEMS, 'suitable', { 'b4': 'na' }),
    section_c: initializeSectionData(SECTION_C_ITEMS, 'suitable', { 'c15': 'na' }),
    section_d: initializeSectionData(SECTION_D_ITEMS, 'suitable'),
    medical_device_risk: 'na',
    medical_device_registered: false,
    medical_device_not_registered: false,
    overall_risk: 'minimal',
    follow_up_months: 12,
    overall_decision: 'approved',
    rejection_reason: '',
    other_suggestions: ''
  });

  const [formData, setFormData] = useState(getInitialFormData());

  // ✅ ดึงข้อมูลเดิมถ้ามี (สำหรับโหมดแก้ไข)
  useEffect(() => {
    const fetchExistingAssessment = async () => {
      try {
        const token = localStorage.getItem('token');
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentUserId = payload.id;

        const res = await api.get(`/assessments/${projectId}`);
        
        // ✅ Debug: ดูโครงสร้างข้อมูลที่ได้จาก Backend
        console.log('All reviews:', res.data);
        
        const myReview = res.data.find(r => r.reviewer_id === currentUserId);
        
        if (myReview) {
          console.log('My review:', myReview);
          console.log('Assessment details:', myReview.assessment_details);
          
          setIsEditing(true);
          setReviewId(myReview.id);
          
          const details = myReview.assessment_details || {};
          const defaults = getInitialFormData();
          
          // ✅ Merge ข้อมูลเก่ากับค่าเริ่มต้น
          setFormData({
            section_a: mergeWithDefaults(details.section_a, defaults.section_a),
            section_b: mergeWithDefaults(details.section_b, defaults.section_b),
            section_c: mergeWithDefaults(details.section_c, defaults.section_c),
            section_d: mergeWithDefaults(details.section_d, defaults.section_d),
            medical_device_risk: myReview.medical_device_risk || 'na',
            medical_device_registered: myReview.medical_device_registered || false,
            medical_device_not_registered: myReview.medical_device_not_registered || false,
            overall_risk: myReview.overall_risk || 'minimal',
            follow_up_months: myReview.follow_up_months || 12,
            overall_decision: myReview.decision || 'approved',
            rejection_reason: myReview.rejection_reason || '',
            other_suggestions: myReview.comments || ''
          });
        }
      } catch (err) {
        console.error("Failed to load existing assessment", err);
      } finally {
        setLoading(false);
      }
    };

    fetchExistingAssessment();
  }, [projectId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.overall_decision === 'rejected' && !formData.rejection_reason.trim()) {
      alert('กรุณาระบุเหตุผลที่ไม่เห็นชอบ');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token'); 
      
      if (isEditing && reviewId) {
        await api.put(`/assessments/${reviewId}`, {
          project_id: parseInt(projectId),
          ...formData
        }, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        alert('✅ อัปเดตผลการประเมินเรียบร้อยแล้ว');
      } else {
        await api.post('/assessments/', {
          project_id: parseInt(projectId),
          ...formData
        }, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        alert('✅ บันทึกผลการประเมินเรียบร้อยแล้ว');
      }
      
      navigate(`/committee-dashboard`); 
    } catch (error) {
      console.error(error);
      alert('❌ เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">
          {isEditing ? 'แก้ไขแบบประเมินจริยธรรมการวิจัย' : 'แบบประเมินจริยธรรมการวิจัยในมนุษย์'}
        </h1>
        <p className="text-gray-600 mt-1">กรุณาประเมินโครงการวิจัยตามเกณฑ์ทั้ง 4 ด้านอย่างครบถ้วน</p>
      </div>
      
      <form onSubmit={handleSubmit}>
        <SectionTable title="A. Scientific Value" items={SECTION_A_ITEMS} sectionKey="section_a" formData={formData} setFormData={setFormData} />
        <SectionTable title="B. Ethical Issues" items={SECTION_B_ITEMS} sectionKey="section_b" formData={formData} setFormData={setFormData} />
        <SectionTable title="C. Informed Consent" items={SECTION_C_ITEMS} sectionKey="section_c" formData={formData} setFormData={setFormData} />
        <SectionTable title="D. Qualification of Investigator" items={SECTION_D_ITEMS} sectionKey="section_d" formData={formData} setFormData={setFormData} />

        {/* ส่วนสรุปและความเสี่ยง */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
          <h3 className="text-lg font-bold text-blue-800 mb-6 border-b pb-2">สรุปผลการประเมินและความเสี่ยง</h3>
          
          {/* ส่วนที่ 1: เครื่องมือแพทย์ */}
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-md font-semibold text-blue-900 mb-4">หากเป็นโครงการวิจัยที่เกี่ยวข้องกับเครื่องมือแพทย์</h4>
            <div className="space-y-3">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input type="radio" name="medical_device_risk" value="non_significant"
                  checked={formData.medical_device_risk === 'non_significant'}
                  onChange={(e) => setFormData({...formData, medical_device_risk: e.target.value})}
                  className="w-4 h-4 mt-1 text-blue-600 focus:ring-blue-500" />
                <span className="text-sm text-gray-800 font-medium">Non-significant risk</span>
              </label>
              <div className="ml-7">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input type="radio" name="medical_device_risk" value="significant"
                    checked={formData.medical_device_risk === 'significant'}
                    onChange={(e) => setFormData({...formData, medical_device_risk: e.target.value})}
                    className="w-4 h-4 mt-1 text-blue-600 focus:ring-blue-500" />
                  <div className="text-sm text-gray-800">
                    <span className="font-medium">Significant risk</span>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                      (เครื่องมือหรืออุปกรณ์ที่มีความเสี่ยงสูงต่อการเสียชีวิต หรือการเกิดความพิการอย่างถาวร...)
                    </p>
                  </div>
                </label>
              </div>
              <label className="flex items-start space-x-3 cursor-pointer ml-7">
                <input type="checkbox" checked={formData.medical_device_registered}
                  onChange={(e) => setFormData({...formData, medical_device_registered: e.target.checked, medical_device_not_registered: false})}
                  className="w-4 h-4 mt-1 text-blue-600 focus:ring-blue-500 rounded" />
                <span className="text-sm text-gray-800">ได้ขึ้นทะเบียนการวิจัยกับหน่วยงาน <strong>USFDA / MDD</strong> หรือหน่วยงานที่เกี่ยวข้อง</span>
              </label>
              <label className="flex items-start space-x-3 cursor-pointer ml-7">
                <input type="checkbox" checked={formData.medical_device_not_registered}
                  onChange={(e) => setFormData({...formData, medical_device_not_registered: e.target.checked, medical_device_registered: false})}
                  className="w-4 h-4 mt-1 text-blue-600 focus:ring-blue-500 rounded" />
                <span className="text-sm text-gray-800">ยังไม่ได้ขึ้นทะเบียนการวิจัยกับหน่วยงาน <strong>USFDA / MDD</strong> หรือหน่วยงานที่เกี่ยวข้อง</span>
              </label>
              <label className="flex items-start space-x-3 cursor-pointer">
                <input type="radio" name="medical_device_risk" value="na"
                  checked={formData.medical_device_risk === 'na'}
                  onChange={(e) => setFormData({...formData, medical_device_risk: e.target.value})}
                  className="w-4 h-4 mt-1 text-gray-600 focus:ring-gray-500" />
                <span className="text-sm text-gray-600 italic">ไม่เกี่ยวข้องกับเครื่องมือแพทย์</span>
              </label>
            </div>
          </div>

          {/* ส่วนที่ 2: ประเมินความเสี่ยงของโครงการ */}
          <div className="mb-8">
            <h4 className="text-md font-semibold text-gray-800 mb-4">ประเมินความเสี่ยงของโครงการ</h4>
            <div className="space-y-3">
              {[
                { val: 'minimal', text: 'มีความเสี่ยงไม่เกินความเสี่ยงเล็กน้อย' },
                { val: 'more_than_minimal_with_benefit', text: 'มีความเสี่ยงเกินกว่าความเสี่ยงเล็กน้อย แต่มีประโยชน์ต่อตัวผู้เข้ารับการวิจัยโดยตรง' },
                { val: 'more_than_minimal_knowledge', text: 'มีความเสี่ยงเกินกว่าความเสี่ยงเล็กน้อย และไม่มีประโยชน์ต่อตัวผู้เข้ารับการวิจัยโดยตรง แต่มีความเป็นไปได้ที่จะได้รับความรู้เกี่ยวกับโรค' },
                { val: 'other', text: 'มีความเสี่ยงและประโยชน์ไม่ตรงกับที่กล่าวมาแล้วทั้งสามข้อ...' }
              ].map((opt) => (
                <label key={opt.val} className="flex items-start space-x-3 cursor-pointer">
                  <input type="radio" name="overall_risk" value={opt.val}
                    checked={formData.overall_risk === opt.val}
                    onChange={(e) => setFormData({...formData, overall_risk: e.target.value})}
                    className="w-4 h-4 mt-1 text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm text-gray-800 leading-relaxed">{opt.text}</span>
                </label>
              ))}
            </div>
          </div>

          {/* ระยะเวลาการรายงานความก้าวหน้า */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">ระยะเวลาการรายงานความก้าวหน้าของโครงการวิจัย</label>
            <div className="flex space-x-6">
              {[{ val: 3, label: '3 เดือน' }, { val: 6, label: '6 เดือน' }, { val: 12, label: '12 เดือน' }].map((opt) => (
                <label key={opt.val} className="flex items-center space-x-2 cursor-pointer">
                  <input type="radio" name="follow_up_months" value={opt.val}
                    checked={formData.follow_up_months === parseInt(opt.val)}
                    onChange={(e) => setFormData({...formData, follow_up_months: parseInt(e.target.value)})}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm text-gray-800">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* สรุปความเห็นโดยรวม */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">สรุปความเห็นโดยรวม ท่านเห็นชอบให้ดำเนินการวิจัยโครงการวิจัยนี้หรือไม่</label>
            <div className="space-y-3">
              {[
                { val: 'approved', text: 'เห็นชอบ' },
                { val: 'approved_with_revision', text: 'เห็นชอบ หากแก้ไขตามข้อเสนอแนะ' },
                { val: 'needs_clarification', text: 'ขอให้ผู้วิจัยชี้แจงเพิ่มเติม เพื่อนำกลับมาพิจารณาใหม่' },
                { val: 'rejected', text: 'ไม่เห็นชอบ' }
              ].map((opt) => (
                <label key={opt.val} className="flex items-center space-x-3 cursor-pointer">
                  <input type="radio" name="decision" value={opt.val} 
                    checked={formData.overall_decision === opt.val}
                    onChange={(e) => setFormData({...formData, overall_decision: e.target.value})}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                  <span className={`text-sm ${opt.val === 'rejected' ? 'text-red-700 font-semibold' : 'text-gray-800'}`}>
                    {opt.text}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {formData.overall_decision === 'rejected' && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <label className="block text-sm font-semibold text-red-700 mb-2">โปรดระบุเหตุผล *</label>
              <textarea required value={formData.rejection_reason}
                onChange={(e) => setFormData({...formData, rejection_reason: e.target.value})}
                className="w-full border border-red-300 rounded px-3 py-2 focus:ring-2 focus:ring-red-500 outline-none" rows="3" />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">ข้อเสนอแนะอื่นๆ</label>
            <textarea value={formData.other_suggestions}
              onChange={(e) => setFormData({...formData, other_suggestions: e.target.value})}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" rows="4" />
          </div>
        </div>

        <div className="flex justify-end space-x-4 sticky bottom-4 bg-gray-50 p-4 border-t border-gray-200 rounded-lg shadow-lg">
          <button type="button" onClick={() => navigate(-1)} className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors">
            ยกเลิก
          </button>
          <button type="submit" disabled={loading} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center">
            {loading ? 'กำลังบันทึก...' : (isEditing ? '💾 อัปเดตผลการประเมิน' : '✅ บันทึกผลการประเมิน')}
          </button>
        </div>
      </form>
    </div>
  );
}