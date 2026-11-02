import React, { useState, useEffect } from 'react';
import api from '../../api';
import { useParams, useNavigate } from 'react-router-dom';

// ================= LABELS & DICTIONARIES =================
const ITEM_LABELS = {
  section_a: {
    'a1': '1. หลักการและเหตุผล', 'a2': '2. การทบทวนวรรณกรรม', 'a3': '3. วัตถุประสงค์',
    'a4': '4. รูปแบบการวิจัย', 'a5': '5. กลุ่มประชากรที่ศึกษา', 'a6': '6. ขนาดตัวอย่าง',
    'a7': '7. การคัดเลือกผู้เข้ารับการวิจัย', 'a8': '8. การคัดผู้เข้ารับการวิจัยออก',
    'a9': '9. การแบ่งกลุ่มอาสาสมัคร', 'a10': '10. วิธีทดสอบที่ใช้ในการวิจัย',
    'a11': '11. การใช้กลุ่มควบคุมหรือยาหลอก', 'a12': '12. การใช้เครื่องมือแพทย์',
    'a13': '13. วิธีการวัดผลการวิจัย', 'a14': '14. การเฝ้าระวังผลแทรกซ้อน',
    'a15': '15. จำนวนและปริมาณของเลือดหรือสิ่งส่งตรวจ', 'a16': '16. ระยะเวลาและจำนวนครั้งของการติดตามผล',
    'a17': '17. สถิติที่ใช้ในการวิเคราะห์'
  },
  section_b: {
    'b1': '1. กลุ่มเปราะบาง', 'b2': '2. แนวทางการปกป้องกลุ่มเปราะบาง',
    'b3': '3. ความเสี่ยงโดยตรง', 'b4': '4. ความเสี่ยงต่อตัวอ่อน/บุตรในครรภ์',
    'b5': '5. มาตรการป้องกันความเสี่ยง', 'b6': '6. ความเสี่ยงต่อชุมชน',
    'b7': '7. ประโยชน์ต่อผู้เข้ารับการวิจัย', 'b8': '8. ประโยชน์ต่อชุมชน',
    'b9': '9. ประโยชน์ต่อสังคม'
  },
  section_c: {
    'c1': '1. วิธีการชักชวน', 'c2': '2. การแจ้งวัตถุประสงค์', 'c3': '3. แหล่งทุนสนับสนุน',
    'c4': '4. ขั้นตอนการปฏิบัติตัว', 'c5': '5. ความเสี่ยงและผลแทรกซ้อน',
    'c6': '6. ประโยชน์ที่ได้รับ', 'c7': '7. การเข้าร่วมโดยสมัครใจ',
    'c8': '8. ทางเลือกอื่น', 'c9': '9. สิทธิในการถอนตัว', 'c10': '10. ค่าตอบแทน/ค่าใช้จ่าย',
    'c11': '11. การเก็บรักษาความลับ', 'c12': '12. ชื่อ/ที่อยู่ผู้วิจัย',
    'c13': '13. ที่อยู่คณะกรรมการ', 'c14': '14. วิธีการแสดงความยินยอม',
    'c15': '15. การขอความยินยอมจากเด็ก'
  },
  section_d: {
    'd1': '1. พื้นฐานอาชีพและประสบการณ์', 'd2': '2. ประวัติการอบรมจริยธรรม',
    'd3': '3. ผลประโยชน์ทับซ้อน'
  }
};

const SECTION_NAMES = {
  section_a: 'A. Scientific Value',
  section_b: 'B. Ethical Issues',
  section_c: 'C. Informed Consent',
  section_d: 'D. Qualification of Investigator'
};

const DECISION_LABELS = {
  'approved': 'เห็นชอบ',
  'approved_with_revision': 'เห็นชอบ หากแก้ไขตามข้อเสนอแนะ',
  'needs_clarification': 'ขอให้ชี้แจงเพิ่มเติม',
  'rejected': 'ไม่เห็นชอบ'
};

const RISK_LABELS = {
  'minimal': 'มีความเสี่ยงไม่เกินความเสี่ยงเล็กน้อย',
  'more_than_minimal_with_benefit': 'มีความเสี่ยงเกินกว่าเล็กน้อย แต่มีประโยชน์โดยตรง',
  'more_than_minimal_knowledge': 'มีความเสี่ยงเกินกว่าเล็กน้อย แต่ได้ความรู้เกี่ยวกับโรค',
  'other': 'อื่นๆ'
};

const MEDICAL_DEVICE_LABELS = {
  'non_significant': 'Non-significant risk',
  'significant': 'Significant risk',
  'na': 'ไม่เกี่ยวข้องกับเครื่องมือแพทย์'
};

// ================= MAIN COMPONENT =================
export default function AssessmentSummary() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);

  // ✅ State สำหรับฟอร์มตัดสินใจขั้นสุดท้าย (แสดงตลอดเวลา)
  const [finalDecision, setFinalDecision] = useState('');
  const [decisionReason, setDecisionReason] = useState('');
  const [finalSummary, setFinalSummary] = useState('');
  const [saving, setSaving] = useState(false);

  // ✅ State ใหม่จาก PDF แบบฟอร์ม
  const [medicalDeviceRisk, setMedicalDeviceRisk] = useState('na');
  const [medicalDeviceRegistered, setMedicalDeviceRegistered] = useState(false);
  const [medicalDeviceNotRegistered, setMedicalDeviceNotRegistered] = useState(false);
  const [overallRisk, setOverallRisk] = useState('minimal');
  const [followUpMonths, setFollowUpMonths] = useState(12);
  const [otherSuggestions, setOtherSuggestions] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserRole(payload.role);
      } catch (e) {
        console.error("Invalid token", e);
      }
    }
    fetchSummary();
  }, [projectId]);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/assessments/summary/${projectId}`);
      setSummary(res.data);

      // ✅ โหลดข้อมูลเดิม (ถ้ามี) มาแสดงในฟอร์ม
      if (res.data.project) {
        const p = res.data.project;
        setFinalDecision(p.final_decision || '');
        setDecisionReason(p.final_decision_reason || '');
        setFinalSummary(p.secretary_final_summary || '');

        // ✅ โหลดข้อมูลใหม่จาก PDF แบบฟอร์ม
        setMedicalDeviceRisk(p.final_medical_device_risk || 'na');
        setMedicalDeviceRegistered(p.final_medical_device_registered || false);
        setMedicalDeviceNotRegistered(p.final_medical_device_not_registered || false);
        setOverallRisk(p.final_overall_risk || 'minimal');
        setFollowUpMonths(p.final_follow_up_months || 12);
        setOtherSuggestions(p.final_other_suggestions || '');
      }
    } catch (err) {
      console.error("Summary Fetch Error:", err);
      setError(err.response?.data?.detail || err.message || 'ไม่สามารถโหลดข้อมูลสรุปได้');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalDecision = async (e) => {
    e.preventDefault();

    if (!finalDecision) {
      alert('กรุณาเลือกผลการตัดสินใจ');
      return;
    }

    if (finalDecision === 'rejected' && !decisionReason.trim()) {
      alert('กรุณาระบุเหตุผลที่ไม่เห็นชอบ');
      return;
    }

    setSaving(true);
    try {
      await api.put(`/admin/projects/${projectId}/final-decision`, {
        final_decision: finalDecision,
        reason: decisionReason,
        summary: finalSummary,
        // ✅ เพิ่มข้อมูลใหม่จาก PDF แบบฟอร์ม
        medical_device_risk: medicalDeviceRisk,
        medical_device_registered: medicalDeviceRegistered,
        medical_device_not_registered: medicalDeviceNotRegistered,
        overall_risk: overallRisk,
        follow_up_months: followUpMonths,
        other_suggestions: otherSuggestions
      });

      alert('✅ บันทึกการตัดสินใจขั้นสุดท้ายเรียบร้อย');
      navigate('/irb-dashboard');
    } catch (err) {
      console.error("Final Decision Error:", err);
      alert('❌ เกิดข้อผิดพลาด: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูลสรุปผลการประเมิน...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700 font-medium mb-2">❌ {error}</p>
          <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition">
            ย้อนกลับ
          </button>
        </div>
      </div>
    );
  }

  if (!summary) return null;

  const { project, total_reviews, decisions, overall_risks, follow_up_months, medical_device_risks, all_comments, all_rejection_reasons, all_other_suggestions, reviewers } = summary;

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">สรุปผลการประเมินจริยธรรมการวิจัย</h1>
          <p className="text-gray-600 mt-1">ภาพรวมผลการประเมินจากคณะกรรมการทั้งหมด</p>
        </div>
        <button onClick={() => navigate(-1)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition">
          ← ย้อนกลับ
        </button>
      </div>

      {/* 1. ข้อมูลโครงการ */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
        <h2 className="text-lg font-bold text-blue-800 mb-4 border-b pb-2">ข้อมูลโครงการ</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">ชื่อโครงการ</p>
            <p className="font-medium text-gray-800">{project.title}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">IRB Number</p>
            <p className="font-medium text-gray-800">{project.irb_number || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">REC Number</p>
            <p className="font-medium text-gray-800">{project.rec_number || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">สถานะโครงการ</p>
            <p className="font-medium text-gray-800 capitalize">{project.status}</p>
          </div>
        </div>
      </div>

      {/* 2. สรุปจำนวนผู้ประเมิน */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
        <h2 className="text-lg font-bold text-blue-800 mb-4 border-b pb-2">ภาพรวมการประเมิน</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-600">จำนวนผู้ประเมิน</p>
            <p className="text-3xl font-bold text-blue-800">{total_reviews} คน</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-600">เห็นชอบ</p>
            <p className="text-3xl font-bold text-green-800">{decisions['approved'] || 0}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <p className="text-sm text-red-600">ไม่เห็นชอบ</p>
            <p className="text-3xl font-bold text-red-800">{decisions['rejected'] || 0}</p>
          </div>
        </div>

        <div className="mt-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">ผลการตัดสินใจทั้งหมด</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(decisions).map(([key, count]) => (
              <span key={key} className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                key === 'approved' ? 'bg-green-100 text-green-700' :
                key === 'approved_with_revision' ? 'bg-yellow-100 text-yellow-700' :
                key === 'needs_clarification' ? 'bg-orange-100 text-orange-700' :
                'bg-red-100 text-red-700'
              }`}>
                {DECISION_LABELS[key] || key}: {count}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 3. สรุปความเสี่ยง */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
        <h2 className="text-lg font-bold text-blue-800 mb-4 border-b pb-2">สรุปความเสี่ยงของโครงการ</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">ระดับความเสี่ยง</h3>
            <ul className="space-y-1">
              {Object.entries(overall_risks).map(([key, count]) => (
                <li key={key} className="text-sm text-gray-700">
                  • {RISK_LABELS[key] || key}: <span className="font-bold">{count}</span> คน
                </li>
              ))}
              {Object.keys(overall_risks).length === 0 && <li className="text-sm text-gray-400 italic">ไม่มีข้อมูล</li>}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">ระยะเวลาการรายงานความก้าวหน้า</h3>
            <ul className="space-y-1">
              {Object.entries(follow_up_months).map(([key, count]) => (
                <li key={key} className="text-sm text-gray-700">
                  • {key} เดือน: <span className="font-bold">{count}</span> คน
                </li>
              ))}
              {Object.keys(follow_up_months).length === 0 && <li className="text-sm text-gray-400 italic">ไม่มีข้อมูล</li>}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">ความเสี่ยงเครื่องมือแพทย์</h3>
            <ul className="space-y-1">
              {Object.entries(medical_device_risks).map(([key, count]) => (
                <li key={key} className="text-sm text-gray-700">
                  • {MEDICAL_DEVICE_LABELS[key] || key}: <span className="font-bold">{count}</span> คน
                </li>
              ))}
              {Object.keys(medical_device_risks).length === 0 && <li className="text-sm text-gray-400 italic">ไม่มีข้อมูล</li>}
            </ul>
          </div>
        </div>
      </div>

      {/* 4. เหตุผลที่ไม่เห็นชอบ */}
      {all_rejection_reasons.length > 0 && (
        <div className="bg-red-50 p-6 rounded-lg shadow-sm border border-red-200 mb-6">
          <h2 className="text-lg font-bold text-red-800 mb-4 border-b border-red-200 pb-2">เหตุผลที่ไม่เห็นชอบ</h2>
          <div className="space-y-3">
            {all_rejection_reasons.map((item, idx) => {
              const reviewer = reviewers.find(r => r.id === item.reviewer_id);
              return (
                <div key={idx} className="bg-white p-4 rounded border border-red-100">
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    ผู้ประเมิน: {reviewer ? `${reviewer.first_name} ${reviewer.last_name} (${reviewer.username})` : `ID ${item.reviewer_id}`}
                  </p>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{item.reason}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. ข้อคิดเห็น/ข้อเสนอแนะทั้งหมด */}
      {all_comments.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          <h2 className="text-lg font-bold text-blue-800 mb-4 border-b pb-2">ข้อคิดเห็นและข้อเสนอแนะทั้งหมด</h2>
          <div className="space-y-3">
            {all_comments.map((item, idx) => {
              const reviewer = reviewers.find(r => r.id === item.reviewer_id);
              return (
                <div key={idx} className="bg-gray-50 p-4 rounded border border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    จาก: {reviewer ? `${reviewer.first_name} ${reviewer.last_name} (${reviewer.username})` : `ID ${item.reviewer_id}`}
                  </p>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{item.comments}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. ข้อที่ไม่เหมาะสม / มีข้อสังเกต */}
      {all_other_suggestions.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          <h2 className="text-lg font-bold text-blue-800 mb-4 border-b pb-2">รายการที่ไม่เหมาะสม / มีข้อสังเกต</h2>
          <div className="space-y-4">
            {all_other_suggestions.map((group, gIdx) => {
              const reviewer = reviewers.find(r => r.id === group.reviewer_id);
              return (
                <div key={gIdx} className="bg-gray-50 p-4 rounded border border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-3">
                    ผู้ประเมิน: {reviewer ? `${reviewer.first_name} ${reviewer.last_name} (${reviewer.username})` : `ID ${group.reviewer_id}`}
                  </p>
                  <div className="space-y-2">
                    {group.items.map((item, iIdx) => (
                      <div key={iIdx} className="bg-white p-3 rounded border border-gray-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-xs text-gray-500 mb-1">{SECTION_NAMES[item.section]}</p>
                            <p className="text-sm font-medium text-gray-800">
                              {ITEM_LABELS[item.section]?.[item.item_id] || item.item_id}
                            </p>
                          </div>
                          <span className={`ml-2 px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                            item.status === 'not_suitable' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {item.status === 'not_suitable' ? 'ไม่เหมาะสม' : 'มีข้อสังเกต'}
                          </span>
                        </div>
                        {item.comment && (
                          <p className="text-sm text-gray-700 mt-2 italic border-t pt-2">
                            ข้อสังเกต: {item.comment}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 7. รายชื่อผู้ประเมินทั้งหมด */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
        <h2 className="text-lg font-bold text-blue-800 mb-4 border-b pb-2">รายชื่อผู้ประเมิน</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">ชื่อ-นามสกุล</th>
                <th className="p-3 text-left">Username</th>
                <th className="p-3 text-left">บทบาท</th>
              </tr>
            </thead>
            <tbody>
              {reviewers.map((r, idx) => (
                <tr key={idx} className="border-b last:border-0">
                  <td className="p-3">{r.first_name} {r.last_name}</td>
                  <td className="p-3">{r.username}</td>
                  <td className="p-3">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                      {r.role}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ✅ 8. ฟอร์มการตัดสินใจขั้นสุดท้าย - แสดงตลอดเวลา (ไม่ต้องซ่อน) */}
      {(userRole === 'irb_officer' || userRole === 'admin') && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-indigo-200 mb-6 ring-1 ring-indigo-100">
          <h2 className="text-lg font-bold text-indigo-800 mb-4 border-b border-indigo-100 pb-2">
            การตัดสินใจขั้นสุดท้าย (สำหรับเจ้าหน้าที่ IRB)
          </h2>

          <form onSubmit={handleFinalDecision} className="space-y-6">
            {/* สรุปผลการประเมินจากคณะกรรมการ */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                สรุปผลการประเมินจากคณะกรรมการ
              </label>
              <textarea
                value={finalSummary}
                onChange={(e) => setFinalSummary(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                rows="4"
                placeholder="สรุปผลการประเมินจากกรรมการทั้งหมด..."
              />
            </div>

            {/* ✅ ส่วนเครื่องมือแพทย์ */}
            <div className="border-t pt-4">
              <h3 className="text-md font-semibold text-gray-800 mb-3">หากเป็นโครงการวิจัยที่เกี่ยวข้องกับเครื่องมือแพทย์</h3>
              <div className="space-y-3 ml-4">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="medical_device_risk"
                    value="non_significant"
                    checked={medicalDeviceRisk === 'non_significant'}
                    onChange={(e) => setMedicalDeviceRisk(e.target.value)}
                    className="w-4 h-4 mt-1 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-800 font-medium">Non-significant risk</span>
                </label>

                <div className="ml-7">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="medical_device_risk"
                      value="significant"
                      checked={medicalDeviceRisk === 'significant'}
                      onChange={(e) => setMedicalDeviceRisk(e.target.value)}
                      className="w-4 h-4 mt-1 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="text-sm text-gray-800">
                      <span className="font-medium">Significant risk</span>
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                        (เครื่องมือหรืออุปกรณ์ที่มีความเสี่ยงสูงต่อการเสียชีวิต หรือการเกิดความพิการอย่างถาวร
                        หรือต้องอาศัยการผ่าตัดเพื่อฝังหรือสอดใส่อุปกรณ์ดังกล่าวเข้าไปในร่างกาย
                        หรือต้องใช้ร่วมกับยาหรือสารบางชนิดไปตลอดชีวิตเพื่อป้องกันการล้มเหลวของอุปกรณ์
                        และยาหรือสารเคมีเหล่านั้นอาจทำให้เสียชีวิตหรือเกิดพิษต่อร่างกายหรือเกิดความพิการอย่างถาวร)
                      </p>
                    </div>
                  </label>
                </div>

                <label className="flex items-start space-x-3 cursor-pointer ml-7">
                  <input
                    type="checkbox"
                    checked={medicalDeviceRegistered}
                    onChange={(e) => {
                      setMedicalDeviceRegistered(e.target.checked);
                      if (e.target.checked) setMedicalDeviceNotRegistered(false);
                    }}
                    className="w-4 h-4 mt-1 text-indigo-600 focus:ring-indigo-500 rounded"
                  />
                  <span className="text-sm text-gray-800">
                    ได้ขึ้นทะเบียนการวิจัยกับหน่วยงาน <strong>USFDA / MDD</strong> หรือหน่วยงานที่เกี่ยวข้อง
                    และมีหลักฐานหรือข้อมูลประกอบ
                  </span>
                </label>

                <label className="flex items-start space-x-3 cursor-pointer ml-7">
                  <input
                    type="checkbox"
                    checked={medicalDeviceNotRegistered}
                    onChange={(e) => {
                      setMedicalDeviceNotRegistered(e.target.checked);
                      if (e.target.checked) setMedicalDeviceRegistered(false);
                    }}
                    className="w-4 h-4 mt-1 text-indigo-600 focus:ring-indigo-500 rounded"
                  />
                  <span className="text-sm text-gray-800">
                    ยังไม่ได้ขึ้นทะเบียนการวิจัยกับหน่วยงาน <strong>USFDA / MDD</strong> หรือหน่วยงานที่เกี่ยวข้อง
                    หรือยังไม่มีหลักฐานหรือข้อมูล
                  </span>
                </label>

                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="medical_device_risk"
                    value="na"
                    checked={medicalDeviceRisk === 'na'}
                    onChange={(e) => setMedicalDeviceRisk(e.target.value)}
                    className="w-4 h-4 mt-1 text-gray-600 focus:ring-gray-500"
                  />
                  <span className="text-sm text-gray-600 italic">ไม่เกี่ยวข้องกับเครื่องมือแพทย์</span>
                </label>
              </div>
            </div>

            {/* ✅ ประเมินความเสี่ยงของโครงการ */}
            <div className="border-t pt-4">
              <h3 className="text-md font-semibold text-gray-800 mb-3">ประเมินความเสี่ยงของโครงการ</h3>
              <div className="space-y-3 ml-4">
                {[
                  { val: 'minimal', text: 'มีความเสี่ยงไม่เกินความเสี่ยงเล็กน้อย' },
                  { val: 'more_than_minimal_with_benefit', text: 'มีความเสี่ยงเกินกว่าความเสี่ยงเล็กน้อย แต่มีประโยชน์ต่อตัวผู้เข้ารับการวิจัยโดยตรง' },
                  { val: 'more_than_minimal_knowledge', text: 'มีความเสี่ยงเกินกว่าความเสี่ยงเล็กน้อย และไม่มีประโยชน์ต่อตัวผู้เข้ารับการวิจัยโดยตรง แต่มีความเป็นไปได้ที่จะได้รับความรู้เกี่ยวกับโรคหรือสภาวะที่ผู้เข้ารับการวิจัยเป็น' },
                  { val: 'other', text: 'มีความเสี่ยงและประโยชน์ไม่ตรงกับที่กล่าวมาแล้วทั้งสามข้อ แต่อาจมีโอกาสที่จะเข้าใจ หรือป้องกัน หรือบรรเทาปัญหาร้ายแรงที่กระทบสุขภาพและความเป็นอยู่ที่ดีของผู้เข้ารับการวิจัย' }
                ].map((opt) => (
                  <label key={opt.val} className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="overall_risk"
                      value={opt.val}
                      checked={overallRisk === opt.val}
                      onChange={(e) => setOverallRisk(e.target.value)}
                      className="w-4 h-4 mt-1 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-800 leading-relaxed">{opt.text}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* ✅ ระยะเวลาการรายงานความก้าวหน้า */}
            <div className="border-t pt-4">
              <h3 className="text-md font-semibold text-gray-800 mb-3">ระยะเวลาการรายงานความก้าวหน้าของโครงการวิจัย</h3>
              <div className="flex space-x-6 ml-4">
                {[
                  { val: 3, label: '3 เดือน' },
                  { val: 6, label: '6 เดือน' },
                  { val: 12, label: '12 เดือน' }
                ].map((opt) => (
                  <label key={opt.val} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="follow_up_months"
                      value={opt.val}
                      checked={followUpMonths === parseInt(opt.val)}
                      onChange={(e) => setFollowUpMonths(parseInt(e.target.value))}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-800">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* ✅ สรุปความเห็นโดยรวม */}
            <div className="border-t pt-4">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                สรุปความเห็นโดยรวม ท่านเห็นชอบให้ดำเนินการวิจัยโครงการวิจัยนี้หรือไม่
              </label>
              <div className="space-y-3 ml-4">
                {[
                  { val: 'approved', text: 'เห็นชอบ', color: 'green' },
                  { val: 'approved_with_revision', text: 'เห็นชอบ หากแก้ไขตามข้อเสนอแนะ', color: 'yellow' },
                  { val: 'needs_clarification', text: 'ขอให้ผู้วิจัยชี้แจงเพิ่มเติม เพื่อนำกลับมาพิจารณาใหม่', color: 'orange' },
                  { val: 'rejected', text: 'ไม่เห็นชอบ', color: 'red' }
                ].map((opt) => (
                  <label key={opt.val} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="final_decision"
                      value={opt.val}
                      checked={finalDecision === opt.val}
                      onChange={(e) => setFinalDecision(e.target.value)}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className={`text-sm ${opt.color === 'red' ? 'text-red-700 font-semibold' : 'text-gray-800'}`}>
                      {opt.text}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {finalDecision === 'rejected' && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg ml-4">
                <label className="block text-sm font-semibold text-red-700 mb-2">
                  เหตุผลที่ไม่เห็นชอบ *
                </label>
                <textarea
                  required
                  value={decisionReason}
                  onChange={(e) => setDecisionReason(e.target.value)}
                  className="w-full border border-red-300 rounded px-3 py-2 focus:ring-2 focus:ring-red-500 outline-none"
                  rows="3"
                  placeholder="โปรดระบุเหตุผลโดยละเอียด..."
                />
              </div>
            )}

            {/* ✅ ข้อเสนอแนะอื่นๆ */}
            <div className="border-t pt-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ข้อเสนอแนะอื่นๆ
              </label>
              <textarea
                value={otherSuggestions}
                onChange={(e) => setOtherSuggestions(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                rows="4"
                placeholder="ข้อเสนอแนะเพิ่มเติมสำหรับผู้วิจัย..."
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition font-medium flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    กำลังบันทึก...
                  </>
                ) : '💾 บันทึกและอัปเดตสถานะโครงการ'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sticky Footer Actions */}
<div className="flex justify-end space-x-4 sticky bottom-4 bg-gray-50 p-4 border-t border-gray-200 rounded-lg shadow-lg backdrop-blur-sm bg-opacity-90">
  <button onClick={() => navigate(-1)} className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition">
    ย้อนกลับ
  </button>
</div>
    </div>
  );
}